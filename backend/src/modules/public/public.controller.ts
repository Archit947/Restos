import { Request, Response, NextFunction } from 'express';
import { db } from '../../database/connection';
import { AppError } from '../../utils/AppError';

export const getWebsiteConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;

    // Fetch website config
    const [websites]: any = await db.query(
      `SELECT w.*, r.restaurant_name, r.logo_url, r.cover_image_url 
       FROM websites w 
       JOIN restaurants r ON w.restaurant_id = r.id 
       WHERE w.tenant_id = ?`,
      [tenantId]
    );

    if (websites.length === 0) {
      return next(new AppError('Website not found', 404));
    }

    const website = websites[0];

    // Fetch active pages
    const [pages]: any = await db.query(
      `SELECT id, title, slug, page_type, sort_order 
       FROM website_pages 
       WHERE website_id = ? AND is_published = TRUE 
       ORDER BY sort_order ASC`,
      [website.id]
    );

    // Fetch cms content for things like address, hours
    const [cmsContents]: any = await db.query(
      'SELECT * FROM cms_content WHERE tenant_id = ?',
      [tenantId]
    );
    const cms = cmsContents[0] || {};

    res.json({
      success: true,
      data: {
        website: {
          title: website.title,
          subtitle: website.subtitle,
          primary_color: website.primary_color,
          secondary_color: website.secondary_color,
          font_family: website.font_family,
          logo_url: website.logo_url,
          cover_image_url: website.cover_image_url,
          is_published: !!website.is_published,
        },
        pages,
        cms: {
          address: cms.address,
          phone: cms.phone,
          email: cms.email,
          opening_hours: cms.opening_hours,
          social_links: cms.social_links,
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;

    const [categories]: any = await db.query(
      'SELECT id, name, description FROM menu_categories WHERE tenant_id = ? AND is_active = TRUE ORDER BY sort_order ASC',
      [tenantId]
    );

    const [items]: any = await db.query(
      'SELECT id, category_id, name, description, base_price, currency, image_url, is_veg FROM menu_items WHERE tenant_id = ? AND is_available = TRUE ORDER BY sort_order ASC',
      [tenantId]
    );

    // Group items by category
    const categorizedMenu = categories.map((cat: any) => ({
      ...cat,
      items: items.filter((item: any) => item.category_id === cat.id),
    }));

    res.json({
      success: true,
      data: categorizedMenu,
    });
  } catch (error) {
    next(error);
  }
};
