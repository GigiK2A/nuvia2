const mongoose = require("mongoose");

/**
 * Connette l'applicazione al database MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/ai-agent", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connessione a MongoDB riuscita");
  } catch (err) {
    console.error("Errore connessione MongoDB", err);
    // Se in sviluppo, continuiamo con lo storage in memoria
    console.warn("🔶 Utilizzo dello storage in memoria come fallback");
    return false;
  }
  return true;
}

// Esporta sia come default che come named export per compatibilità
module.exports = connectDB;
module.exports.default = connectDB;