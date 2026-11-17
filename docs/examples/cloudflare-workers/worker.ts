import { serve } from 'routup/cloudflare';
import { app } from './app.ts';

export default serve(app, { manual: true });
