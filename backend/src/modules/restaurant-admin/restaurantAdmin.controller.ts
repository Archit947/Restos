import { Request, Response, NextFunction } from 'express';
import { query, db } from '../../database/connection';
import { AppError } from '../../utils/AppError';
import { v4 as uuidv4 } from 'uuid';

export const getTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const templates = await query(
      'SELECT id, name, slug, description, thumbnail, preview_url, category, version, is_default FROM templates WHERE is_active = TRUE ORDER BY is_default DESC, name ASC'
    );
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

export const completeSetup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const conn = await db.getConnection();
  try {
    const { restaurantId, tenantId, id: credentialsId } = req.restaurantUser!;
    const wizardData = req.body;

    await conn.beginTransaction();

    // 1. Template Selection
    if (wizardData.templateId) {
      await conn.execute(
        'UPDATE websites SET template_id = ? WHERE restaurant_id = ?',
        [wizardData.templateId, restaurantId]
      );
    }

    // 2. Info & Hours
    if (wizardData.infoAndHours) {
      const { restaurantName, email, phone, address, city, state, zipCode, country, description, openingHours, socialLinks } = wizardData.infoAndHours;
      
      await conn.execute(
        `UPDATE restaurants 
         SET business_name = ?, email = ?, phone = ?, full_address = ?, city = ?, state = ?, zip_code = ?, country = ?, description = ? 
         WHERE id = ?`,
        [restaurantName, email, phone, address, city, state, zipCode, country, description || null, restaurantId]
      );

      await conn.execute(
        `UPDATE cms_content 
         SET business_name = ?, email = ?, phone = ?, address = ?, description = ?, opening_hours = ?, social_links = ? 
         WHERE restaurant_id = ?`,
        [restaurantName, email, phone, address, description || null, JSON.stringify(openingHours || {}), JSON.stringify(socialLinks || {}), restaurantId]
      );
    }

    // 4. SEO Settings
    if (wizardData.seoSettings) {
      const { websiteTitle, metaDescription, metaKeywords, googleAnalyticsId } = wizardData.seoSettings;
      
      // We store metaKeywords inside schema_markup JSON or robots_txt for now if there is no dedicated column, 
      // or just update websites title
      await conn.execute(
        `UPDATE websites SET title = ?, subtitle = ? WHERE restaurant_id = ?`,
        [websiteTitle, metaDescription || null, restaurantId]
      );
      
      await conn.execute(
        `UPDATE website_settings SET google_analytics_id = ? WHERE tenant_id = ?`,
        [googleAnalyticsId || null, tenantId]
      );
    }

    // 5. Blog
    if (wizardData.blogSettings?.blogEnabled) {
      await conn.execute(
        `UPDATE subscriptions SET blog_enabled = TRUE WHERE restaurant_id = ?`,
        [restaurantId]
      );

      const categories = wizardData.blogSettings.categories || [];
      for (const cat of categories) {
        await conn.execute(
          `INSERT IGNORE INTO blog_categories (id, tenant_id, restaurant_id, name, slug) VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), tenantId, restaurantId, cat, cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')]
        );
      }
    }

    // 6. Reservations
    if (wizardData.reservationSettings?.reservationsEnabled) {
      await conn.execute(
        `UPDATE subscriptions SET reservation_enabled = TRUE WHERE restaurant_id = ?`,
        [restaurantId]
      );
      // specific capacity logic would be saved into CMS or settings here if schema supports it
    }

    // 7. Events
    if (wizardData.eventSettings?.eventsEnabled) {
      await conn.execute(
        `UPDATE subscriptions SET events_enabled = TRUE WHERE restaurant_id = ?`,
        [restaurantId]
      );

      const evt = wizardData.eventSettings;
      if (evt.firstEventName && evt.firstEventDate) {
        await conn.execute(
          `INSERT INTO events (id, tenant_id, restaurant_id, title, event_date, event_time, ticket_price, capacity)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(), tenantId, restaurantId, 
            evt.firstEventName, evt.firstEventDate, 
            evt.firstEventStartTime ? evt.firstEventStartTime + ':00' : null, 
            evt.firstEventTicketPrice || 0, 
            evt.firstEventCapacity || null
          ]
        );
      }
    }

    // 8. Affiliates
    if (wizardData.affiliateSettings?.affiliateEnabled) {
      await conn.execute(
        `UPDATE subscriptions SET affiliate_enabled = TRUE WHERE restaurant_id = ?`,
        [restaurantId]
      );
      // could store commission configuration in a tenant_settings JSON
    }

    // 9. Ad Banners
    if (wizardData.adBannerSettings?.bannersEnabled) {
      const banner = wizardData.adBannerSettings;
      if (banner.bannerMessage) {
        const rules = JSON.stringify({
          backgroundColor: banner.backgroundColor,
          textColor: banner.textColor,
          dismissible: banner.dismissible,
          ctaText: banner.ctaText
        });
        
        await conn.execute(
          `INSERT INTO marketing_banners (id, tenant_id, restaurant_id, title, banner_type, link_url, display_rules, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [
            uuidv4(), tenantId, restaurantId, 
            banner.bannerMessage, 
            banner.bannerType === 'popup' ? 'popup' : 'promotional',
            banner.ctaLink || null, 
            rules
          ]
        );
      }
    }

    // Finalize: mark setup completed
    await conn.execute(
      'UPDATE restaurant_credentials SET setup_completed = TRUE WHERE id = ?', 
      [credentialsId]
    );

    await conn.commit();
    res.json({ success: true, message: 'Setup completed successfully' });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId, tenantId } = req.restaurantUser!;
    
    // In a real scenario, we would count from multiple tables
    // For now, we mock some stats for the specific restaurant
    const [[reservationsResult], [eventsResult]] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM reservations WHERE restaurant_id = ?', [restaurantId]),
      db.query('SELECT COUNT(*) as count FROM events WHERE restaurant_id = ?', [restaurantId])
    ]) as any;

    res.json({ 
      success: true, 
      data: {
        revenue: 2459.50,
        orders: 84,
        visitors: 1204,
        reservations: reservationsResult?.[0]?.count || 12,
        events: eventsResult?.[0]?.count || 0,
      } 
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardCharts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    
    const revenueData = [
      { name: 'Mon', revenue: 4000 },
      { name: 'Tue', revenue: 3000 },
      { name: 'Wed', revenue: 5000 },
      { name: 'Thu', revenue: 2780 },
      { name: 'Fri', revenue: 6890 },
      { name: 'Sat', revenue: 8390 },
      { name: 'Sun', revenue: 7490 },
    ];

    res.json({ success: true, data: revenueData });
  } catch (error) {
    next(error);
  }
};

export const getDashboardActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    
    const recentOrders = [
      { id: '#ORD-001', customer: 'John Doe', items: 3, total: 45.00, status: 'preparing', time: '10 mins ago' },
      { id: '#ORD-002', customer: 'Sarah Smith', items: 1, total: 12.50, status: 'ready', time: '15 mins ago' },
      { id: '#ORD-003', customer: 'Mike Johnson', items: 5, total: 89.00, status: 'delivered', time: '1 hour ago' },
      { id: '#ORD-004', customer: 'Emily Brown', items: 2, total: 24.00, status: 'cancelled', time: '2 hours ago' },
    ];

    res.json({ success: true, data: recentOrders });
  } catch (error) {
    next(error);
  }
};
