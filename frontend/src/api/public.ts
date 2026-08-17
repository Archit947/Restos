import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const pub = axios.create({ baseURL: `${BASE}/public` });

export const publicApi = {
  getInfo:     (sub: string) => pub.get(`/${sub}`),
  getMenu:     (sub: string) => pub.get(`/${sub}/menu`),
  getEvents:   (sub: string) => pub.get(`/${sub}/events`),
  bookEvent:   (sub: string, id: number, data: object) => pub.post(`/${sub}/events/${id}/book`, data),
  getBlog:     (sub: string) => pub.get(`/${sub}/blog`),
  getBlogPost: (sub: string, slug: string) => pub.get(`/${sub}/blog/${slug}`),
  bookTable:   (sub: string, data: object) => pub.post(`/${sub}/reservations`, data),
  placeOrder:      (sub: string, data: object) => pub.post(`/${sub}/orders`, data),
  trackOrder:      (sub: string, orderNumber: string) => pub.get(`/${sub}/orders/${orderNumber}`),
  getStore:        (sub: string) => pub.get(`/${sub}/store`),
  placeStoreOrder: (sub: string, data: object) => pub.post(`/${sub}/store/orders`, data),
  getAboutContent: (sub: string) => pub.get(`/${sub}/about-content`),
  getReviews:      (sub: string) => pub.get(`/${sub}/reviews`),
  submitReview:    (sub: string, data: object) => pub.post(`/${sub}/reviews`, data),
};
