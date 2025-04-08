import 'reflect-metadata';
import { app } from './app';

const PORT = process.env.PORT || 6000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`📝 API Docs: http://${HOST}:${PORT}/api-docs`);
  console.log('2FA Custom Detector is ready to process transactions!');
});
