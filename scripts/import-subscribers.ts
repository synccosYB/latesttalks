import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ParsedSubscriber {
  email: string;
  name: string | null;
}

function parseSubscriberFile(filePath: string): ParsedSubscriber[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const subscribers: ParsedSubscriber[] = [];
  const seenEmails = new Set<string>();
  
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  
  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.includes('NEVER SUBSCRIBED')) continue;
    if (line.startsWith('Phone') && line.includes('Email')) continue;
    
    const emails = line.match(emailRegex);
    if (!emails || emails.length === 0) continue;
    
    let email = emails[0].toLowerCase().trim();
    
    if (email.endsWith('subscribed')) {
      email = email.replace(/subscribed$/i, '');
    }
    
    if (seenEmails.has(email)) continue;
    if (!email.includes('@')) continue;
    
    seenEmails.add(email);
    
    const parts = line.split('\t').filter(p => p.trim());
    let name: string | null = null;
    
    if (parts.length > 0) {
      const firstPart = parts[0].trim();
      if (firstPart && !firstPart.includes('@') && firstPart.length > 1 && firstPart.length < 50) {
        if (!/^\d+$/.test(firstPart)) {
          name = firstPart;
        }
      }
    }
    
    subscribers.push({ email, name });
  }
  
  return subscribers;
}

async function importSubscribers() {
  const filePath = path.join(__dirname, '../attached_assets/Pasted-Phone-Email-Member-status-Last-activity-Address-Yoel-Bochner-yoel-synccos-com--1764524331115_1764524331118.txt');
  
  console.log('Parsing subscriber file...');
  const subscribers = parseSubscriberFile(filePath);
  console.log(`Found ${subscribers.length} unique subscribers to import`);
  
  console.log('\nSample subscribers:');
  subscribers.slice(0, 10).forEach(s => console.log(`  - ${s.email} (${s.name || 'no name'})`));
  
  fs.writeFileSync(
    path.join(__dirname, 'parsed-subscribers.json'),
    JSON.stringify(subscribers, null, 2)
  );
  console.log(`\nFull list saved to scripts/parsed-subscribers.json`);
  
  return subscribers;
}

importSubscribers().catch(console.error);
