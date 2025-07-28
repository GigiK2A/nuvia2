import React from 'react';
import { Helmet } from 'react-helmet-async';
import DocumentAIUploader from '@/components/document/DocumentAIUploader';

export default function DocumentGeneratorPage() {
  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>Genera Documenti - Agente IA</title>
        <meta name="description" content="Carica e modifica documenti con l'intelligenza artificiale" />
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Genera Documenti</h1>
        <p className="text-muted-foreground">
          Carica un documento PDF o Word e l'IA lo rielaborerà secondo le tue istruzioni.
        </p>
      </div>
      
      <DocumentAIUploader />
    </div>
  );
}