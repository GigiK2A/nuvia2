export function simulateCodeGeneration(prompt: string) {
  return {
    success: true,
    name: "progetto-simulato",
    files: {
      "index.html": `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Progetto simulato</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>🔧 Progetto simulato</h1>
  <p>Questa è una simulazione AI per il prompt:</p>
  <pre>${prompt}</pre>
</body>
</html>
      `.trim(),

      "style.css": `
body {
  font-family: Arial, sans-serif;
  background: #f4f4f4;
  color: #333;
  padding: 2rem;
}
h1 {
  color: #007bff;
}
      `.trim()
    }
  };
}