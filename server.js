require('dotenv').config();
const express = require('express');
const AppDataSource = require('./src/data-source');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 5000;

app.get('/', (req, res) => {
  res.json({
    message: 'Clean Task Manager API – ready for auth',
    status: 'alive',
  });
});

app.use('/auth', authRoutes);

(async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected and ready!');
    console.log('Registered entities:', AppDataSource.entityMetadatas.map((entity) => entity.name));

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to DB:', err);
    process.exit(1);
  }
})();