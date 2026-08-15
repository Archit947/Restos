import { Request, Response, NextFunction } from 'express';
import { query, execute } from '../../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import path from 'path';
import 'multer'; // augments Express.Request with .file / .files

export const getWebsiteConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId, tenantId } = req.restaurantUser!;
    
    let [website] = await query('SELECT * FROM websites WHERE restaurant_id = ?', [restaurantId]);
    
    // Auto-initialize website config if it doesn't exist
    if (!website) {
      const id = uuidv4();
      const [restaurant] = await query('SELECT restaurant_name FROM restaurants WHERE id = ?', [restaurantId]);
      const defaultTitle = restaurant?.restaurant_name || 'Our Restaurant';
      
      await execute(
        `INSERT INTO websites (id, restaurant_id, tenant_id, title, primary_color, secondary_color, font_family, is_published) 
         VALUES (?, ?, ?, ?, '#6366f1', '#8b5cf6', 'Inter', false)`,
        [id, restaurantId, tenantId, defaultTitle]
      );
      
      [website] = await query('SELECT * FROM websites WHERE id = ?', [id]);
    }

    // Auto-initialize system pages if none exist
    const existingPages = await query('SELECT id FROM website_pages WHERE website_id = ?', [website.id]);
    if (existingPages.length === 0) {
      const systemPages = [
        { title: 'Home', slug: '', page_type: 'home', sort_order: 0 },
        { title: 'About Us', slug: 'about', page_type: 'about', sort_order: 1 },
        { title: 'Menu', slug: 'menu', page_type: 'menu', sort_order: 2 },
        { title: 'Gallery', slug: 'gallery', page_type: 'gallery', sort_order: 3 },
        { title: 'Reservations', slug: 'reservations', page_type: 'reservation', sort_order: 4 },
        { title: 'Events', slug: 'events', page_type: 'events', sort_order: 5 },
        { title: 'Contact', slug: 'contact', page_type: 'contact', sort_order: 6 },
      ];
      for (const page of systemPages) {
        await execute(
          `INSERT INTO website_pages (id, website_id, tenant_id, title, slug, page_type, is_published, is_system, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, false, true, ?)`,
          [uuidv4(), website.id, tenantId, page.title, page.slug, page.page_type, page.sort_order]
        );
      }
    }
    
    const pages = await query(
      'SELECT id, title, slug, page_type, is_published, is_system FROM website_pages WHERE website_id = ? ORDER BY sort_order ASC', 
      [website.id]
    );

    // Fetch CMS content (contact info, hours, social links)
    let [cms] = await query('SELECT * FROM cms_content WHERE restaurant_id = ?', [restaurantId]);
    if (!cms) {
      const cmsId = uuidv4();
      await execute(
        'INSERT INTO cms_content (id, tenant_id, restaurant_id) VALUES (?, ?, ?)',
        [cmsId, tenantId, restaurantId]
      );
      [cms] = await query('SELECT * FROM cms_content WHERE id = ?', [cmsId]);
    }

    // Fetch restaurant info to get logo & cover urls
    const [restaurant] = await query('SELECT logo_url, cover_image_url FROM restaurants WHERE id = ?', [restaurantId]);
    
    res.json({ 
      success: true, 
      data: { 
        ...website, 
        pages,
        logo_url: restaurant?.logo_url || null,
        cover_image_url: restaurant?.cover_image_url || null,
        cms: {
          address: cms?.address || '',
          phone: cms?.phone || '',
          email: cms?.email || '',
          opening_hours: cms?.opening_hours || null,
          social_links: cms?.social_links || null,
        }
      } 
    });
  } catch (error) {
    next(error);
  }
};

export const updateWebsiteConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    const { title, subtitle, primaryColor, secondaryColor, fontFamily } = req.body;
    
    await execute(
      `UPDATE websites 
       SET title = ?, subtitle = ?, primary_color = ?, secondary_color = ?, font_family = ?
       WHERE restaurant_id = ?`,
      [title, subtitle || null, primaryColor, secondaryColor, fontFamily, restaurantId]
    );
    
    res.json({ success: true, message: 'Website configuration updated' });
  } catch (error) {
    next(error);
  }
};

export const togglePublishStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    
    const [website] = await query('SELECT is_published FROM websites WHERE restaurant_id = ?', [restaurantId]);
    if (!website) {
      res.status(404).json({ success: false, message: 'Website not found' });
      return;
    }
    
    const newStatus = !website.is_published;
    await execute('UPDATE websites SET is_published = ? WHERE restaurant_id = ?', [newStatus, restaurantId]);
    
    res.json({ success: true, message: newStatus ? 'Website published successfully' : 'Website taken offline', is_published: newStatus });
  } catch (error) {
    next(error);
  }
};

// Returns a middleware that handles logo or cover upload
export const uploadWebsiteImage = (imageType: 'logo' | 'cover') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { restaurantId } = req.restaurantUser!;

      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }

      const backendUrl = config.platform.url;
      const fileUrl = `${backendUrl}/uploads/${req.file.filename}`;

      const column = imageType === 'logo' ? 'logo_url' : 'cover_image_url';
      await execute(`UPDATE restaurants SET ${column} = ? WHERE id = ?`, [fileUrl, restaurantId]);

      res.json({ success: true, message: `${imageType === 'logo' ? 'Logo' : 'Cover image'} uploaded`, url: fileUrl });
    } catch (error) {
      next(error);
    }
  };
};

export const updateCmsContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId, tenantId } = req.restaurantUser!;
    const { address, phone, email, opening_hours, social_links } = req.body;

    const [existing] = await query('SELECT id FROM cms_content WHERE restaurant_id = ?', [restaurantId]);
    if (existing) {
      await execute(
        'UPDATE cms_content SET address = ?, phone = ?, email = ?, opening_hours = ?, social_links = ? WHERE restaurant_id = ?',
        [address || null, phone || null, email || null, 
         opening_hours ? JSON.stringify(opening_hours) : null,
         social_links ? JSON.stringify(social_links) : null,
         restaurantId]
      );
    } else {
      await execute(
        'INSERT INTO cms_content (id, tenant_id, restaurant_id, address, phone, email, opening_hours, social_links) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), tenantId, restaurantId, address || null, phone || null, email || null,
         opening_hours ? JSON.stringify(opening_hours) : null,
         social_links ? JSON.stringify(social_links) : null]
      );
    }

    res.json({ success: true, message: 'Contact information updated' });
  } catch (error) {
    next(error);
  }
};

export const togglePageVisibility = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    const { pageId } = req.params;

    // Verify page belongs to this restaurant's website
    const [page] = await query(
      `SELECT wp.id, wp.is_published FROM website_pages wp 
       JOIN websites w ON wp.website_id = w.id 
       WHERE wp.id = ? AND w.restaurant_id = ?`,
      [pageId, restaurantId]
    );

    if (!page) {
      res.status(404).json({ success: false, message: 'Page not found' });
      return;
    }

    const newStatus = !page.is_published;
    await execute('UPDATE website_pages SET is_published = ? WHERE id = ?', [newStatus, pageId]);

    res.json({ success: true, is_published: newStatus, message: newStatus ? 'Page is now visible' : 'Page is now hidden' });
  } catch (error) {
    next(error);
  }
};
