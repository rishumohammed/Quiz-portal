import { CertificateService } from './src/services/certificate.service.js';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Generating sample certificate with updated CertificateService...');
  try {
    const { pdfUrl, buffer } = await CertificateService.generateParticipationCertificate(
      'John Doe',
      'KEFTA ~ NATIONAL LEVEL TALENT HUNT',
      new Date()
    );
    fs.writeFileSync('sample_certificate.pdf', buffer);
    console.log('Successfully generated certificate:', pdfUrl, 'and saved sample_certificate.pdf');
    process.exit(0);
  } catch (err) {
    console.error('Error generating sample certificate:', err);
    process.exit(1);
  }
}

main();
