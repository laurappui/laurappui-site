CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, stripe_session_id TEXT NOT NULL UNIQUE, stripe_payment_intent TEXT,
  receipt_token TEXT NOT NULL UNIQUE, customer_email TEXT, customer_name TEXT, offer_key TEXT, offer_label TEXT,
  amount_total INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'eur', paid_at TEXT NOT NULL, client_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_token ON payments(receipt_token);

CREATE TABLE IF NOT EXISTS clients (
 id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL DEFAULT 'particulier', name TEXT NOT NULL, company TEXT,
 email TEXT, phone TEXT, address TEXT, postal_code TEXT, city TEXT, country TEXT DEFAULT 'France', siret TEXT, vat_number TEXT, notes TEXT, status TEXT NOT NULL DEFAULT 'actif', source TEXT DEFAULT 'manuel', updated_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS documents (
 id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, number TEXT NOT NULL UNIQUE, client_id INTEGER,
 label TEXT NOT NULL, amount_cents INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'brouillon', due_date TEXT,
 notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(client_id) REFERENCES clients(id)
);
CREATE TABLE IF NOT EXISTS tasks (
 id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, title TEXT NOT NULL, due_date TEXT, status TEXT NOT NULL DEFAULT 'a-faire',
 priority TEXT NOT NULL DEFAULT 'normale', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS abby_invoices (
 id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, abby_number TEXT NOT NULL, label TEXT NOT NULL,
 amount_cents INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'a-facturer', issue_date TEXT, due_date TEXT,
 payment_method TEXT, abby_url TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS contact_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, request_type TEXT, offer TEXT, subject TEXT, message TEXT, availability TEXT, preferred_contact TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
