import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // <-- ✅ Import cors
import { generateLeoProgramFromJson } from '../leo_information_code_generation';

const app = express();

// ✅ Enable CORS for all origins or specific one
app.use(cors({
  origin: 'http://localhost:5173' // Allow Vite frontend
}));

app.use(bodyParser.json());

app.post('/generate-leo', (req, res) => {
  const { jsonString, companyId, baseName } = req.body;

  try {
    generateLeoProgramFromJson(jsonString, companyId, baseName);
    res.status(200).send('✅ Leo program generated');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error generating Leo program');
  }
});

app.listen(3001, () => {
  console.log('🚀 API running at http://localhost:3001');
});
