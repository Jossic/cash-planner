# CAHIER DES CHARGES

## Demande initiale :

Je suis à développeur à mon compte, tous les mois, je dois faire ma TVA, ma déclaration URSSAF, etc...
Tous les mois je dois prendre mes factures du mois précédent, vérifier quand ça a été encaissé (prestation la TVA est sur les encaissements), c'est assez pénible.
En plus, j'ai un tableau excel qui me permet de voir a peu près l'évolution de ma trésorerie, mais souvent j'anticipe mal car, quand je déclare ma TVA de juin par exemple début juillet, c'est ma facture de mai, qui a été payée sur juin, mais je la déclare en juillet, je la paie en juillet, et l'urssaf est payé en aout... C'est toujours assez compliqué d'estimer exactement combien j'ai le droit de me verser, combien je dois mettre de coté pour payer ma prochaine echeance de tva+urssaf, etc... Et je suis assez juste en tréso, je n'arrive pas à mettre de coté.
J'essaie de me faire des tableaux pour pouvoir suivre, je met mon CA HT encaissé sur la période, je calcul la TVA, je vais sur l'urssaf, je calcul le montant que je leur doit, je fais mes déclarations, etc...

J'aimerais avoir un outil un peu plus performant que de simples tableaux excel qui sont très moyen, qui ne me permettent pas de calculer rapidement et simplement ma tréso, souvent, quand j'ai un gros mois, comme sur les images que je te partage le mois de juin, je fais ma TVA le 12 juillet, je met de coté 2835,06 (tva payé le 20 juillet, urssaf le 5 aout), mais c'est le montant que je dois payer le mois suivant. Mais du coup, quand je suis payé de ma facture de juillet le 5 aout, je prend sur le montant du paiement pour la prochaine TVA, mais du coup quand j'ai un gros mois et un petit mois qui se suit, il ne me reste plus beaucoup pour vivre: 3483,01 seulement du coup par rapport à 5828,94 le mois precedent.
Et du coup souvent j'ai du mal à gérer correctement le décallage d'un mois, parce que je prend l'argent que je touche du mois en cours pour préparer ma TVA et mon urssaf que je vais payer le mois suivant... Du coup j'ai un mois de retard...

J'aimerais me créer un outil pour gérer tout ça plus facilement, avoir un visu propre de ma tréso, pouvoir anticiper plus facilement, m'aider à préparer mes déclarations urssaf et tva, gagner du temps, ne pas me retrouver dans le rouge tous les mois, etc...

J'ai besoin de créer une app Tauri+vite pour mettre en place une app de suivi de mon budget, pour moi calculer la tva, urssaf, prévoir ma tréso, etc...

Est-ce que tu penses qu'un tel outil serait faisable ? Si oui, est-ce que tu pourrais me donner un cahier des charges complet qui comprend :
- Liste des différentes pages de l'interface avec un wireframe pour chaque page
- Liste de chacune des fonctionnalités
- Détail sur l'architecture (clean archi: back: controller -> command/query handler -> gateway/repository, front: component -> hook/store -> use case -> gateways)
- Stack: Tauri rust / React (tailwind)
- Tout autre choses qui serait nécessaire pour transmettre à un dev pour développer cette application


## Cahier des charges

Yes—totally feasible. Below is a complete, dev-ready spec for a local, lightweight Tauri (Rust) + SolidJS + Tailwind app to manage VAT on encaissements, URSSAF, cashflow, and monthly closings.

1) Objectifs & règles métier
   TVA sur encaissements : TVA collectée basée sur payment_date des factures encaissées dans le mois M. TVA déductible basée sur payment_date des dépenses du mois M.
   TVA_due(M) = ΣTVA_collectée(M) – ΣTVA_déductible(M)

URSSAF : montant calculé sur le CA encaissé du mois M (taux configurable) avec prélèvement à J=5 du mois M+1 (configurable).

Décalages gérés nativement : calculs ≠ paiements (déclaration TVA le 12, paiement le 20, URSSAF le 5, etc.—toutes dates paramétrables).

Trésorerie : séparation stricte en “enveloppes” :
disponible = encaissements – (TVA_due à venir) – (URSSAF_due à venir) – (autres charges planifiées)
Proposition de “montant à se verser” après provisions.

Local-first, offline. Pas de cloud, SQLite embarqué, exports CSV/PDF.

2) Pages & wireframes (ASCII)
   2.1 Dashboard
   pgsql
   Copy
   Edit
   +--------------------------------------------------------------+``
   |  Header: Mois courant  | Solde banque | A mettre de côté     |
   +------------------------+-------------------------------------+
   |  Cartes:                                                   |
   |  [Encaissements M] [TVA due (M) -> payée le 20 M+1]         |
   |  [URSSAF due (M) -> le 5 M+1] [Disponible pour salaire]     |
   +--------------------------------------------------------------+
   |  Timeline (J): encaissements / TVA / URSSAF / solde proj.    |
   +--------------------------------------------------------------+
   |  CTA: "Clore le mois"  "Préparer TVA"  "Préparer URSSAF"     |
   +--------------------------------------------------------------+
   2.2 Encaissements (Factures)
   pgsql
   Copy
   Edit
   +-------------------+------------------------------------------+
   | Filtres: Mois | Client | Status(paid/unpaid) | Source        |
   +--------------------------------------------------------------+
   | Tbl: Date presta | Facture | HT | TVA | TTC | Payé le | Src  |
   | [ + Nouvelle facture ]   [ Import CSV/JSON/Malt ]            |
   +--------------------------------------------------------------+
   2.3 Dépenses (TVA déductible)
   pgsql
   Copy
   Edit
   +------ Dépenses ---+------------------------------------------+
   | Filtres: Mois | Catégorie | TVA (%) |                        |
   +--------------------------------------------------------------+
   | Tbl: Date | Libellé | HT | TVA | TTC | Payé le | Pièce       |
   | [ + Nouvelle dépense ] [ Import relevé bancaire CSV ]        |
   +--------------------------------------------------------------+
   2.4 Rapprochement bancaire
   sql
   Copy
   Edit
   +---------------------------+----------------------------------+
   | Colonne A: Transactions banque (CSV)                         |
   | Colonne B: Encaissements/Dépenses à matcher                  |
   +--------------------------------------------------------------+
   | Drag&Drop / Auto-match (montant ~, date ±xj, libellé fuzzy)  |
   +--------------------------------------------------------------+
   2.5 TVA – Assistant mensuel
   java
   Copy
   Edit
   Etape 1: Sélection mois M
   Etape 2: Récap encaissements M (collectée) & dépenses M (déductible)
   Etape 3: TVA a payer = X  | Générer PDF/CSV déclaration
   Etape 4: Créer provision "TVA M" échéance 20 M+1
   2.6 URSSAF – Assistant mensuel
   yaml
   Copy
   Edit
   Etape 1: Sélection mois M
   Etape 2: CA encaissé M * taux = Y
   Etape 3: Générer mémo / rappel | Provision URSSAF échéance 5 M+1
   2.7 Prévision & Simulation
   lua
   Copy
   Edit
   +--------------------------------------------------------------+
   | Horizon: 3 / 6 / 12 mois | Paramètres (taux, jours payeurs)  |
   +--------------------------------------------------------------+
   | Graph: Cashflow projeté (solde, TVA/URSSAF futures)          |
   +--------------------------------------------------------------+
   | Simulation "gros mois/petit mois" et "salaire cible"         |
   +--------------------------------------------------------------+
   2.8 Clôture mensuelle
   cpp
   Copy
   Edit
   Checklist:
   [ ] Encaissements importés           [ ] Dépenses importées
   [ ] Rapprochement ok                 [ ] Provision TVA créée
   [ ] Provision URSSAF créée           [ ] Rapport PDF exporté
   Bouton: "Clore M" => verrouillage des écritures M
   2.9 Paramètres
   bash
   Copy
   Edit
   Identité | Taux TVA par défaut (20) | Taux URSSAF (%) | Jour prélèvements
   Jours déclaration/paiement TVA | Catégories dépenses | Sources (Malt…)
   Sécurité (chiffrage DB) | Backup | Reset
   2.10 Rapports
   swift
   Copy
   Edit
   TVA (M/M+1), URSSAF (M/M+1), Compte de résultat simplifié, Cash runway
   Exports CSV/PDF
3) Fonctionnalités détaillées
   Imports

Bank CSV (libellés, montants, dates) + mapping colonnes.

Factures (CSV/JSON), modèle Malt inclus.

Dépenses (CSV) avec taux TVA et justificatif.

Rapprochement auto (fuzzy par montant ±0.5€, date ±3j, heuristique libellé).

Calculs

TVA collectée/déductible par payment_date (mois M).

URSSAF = CA encaissé(M) * taux.

Provisions automatiques avec échéance et catégorie.

Prévision

Projections mensuelles = encaissements prévus – provisions futures.

“Montant à se verser” proposé (after-provisions + buffer configurable).

Clôture

Génération de PDF (récap et check-list), lock des écritures M.

Sécurité

Fichier SQLite local; option SQLCipher; clé stockée dans OS Keychain.

Exports

TVA/URSSAF CSV + justificatifs (zip), rapports PDF.

4) Stack & architecture
   4.1 Stack
   Desktop: Tauri (Rust 1.78+)

UI: SolidJS + Vite + TailwindCSS

DB: SQLite (SQLx, migrations via sqlx-cli)

PDF: printpdf (Rust) ou HTML->PDF via wkhtmltopdf embarqué (flag)

Crypto: keyring (stockage clé), option SQLCipher

Tests: cargo test, Playwright (snapshots UI si besoin)

4.2 Clean Architecture (mono-repo)
bash
Copy
Edit
/apps
/desktop   (Tauri + SolidJS)
/crates
/domain    (purs business: entities, value objects, usecases)
/infra     (sqlite repo, bank parsers, pdf, keychain)
/app       (application services: handlers, mapping)
/packages
/ui        (design system SolidJS)
// shared types via JSON schema (zod) du côté SolidJS
Couche Rust
domain

Entities: Invoice, Expense, Payment, Provision, Month, VatReport, UrssafReport

Use cases:

ComputeVatForMonth

ComputeUrssafForMonth

CloseMonth

ReconcileTransactions

ForecastCashflow

Ports (traits):

InvoiceRepo, ExpenseRepo, PaymentRepo, ProvisionRepo, TxRepo

PdfGateway, Clock, ConfigRepo

infra

Adapters SQLite (SQLx) implémentant les repos.

## Implémentation (MVP livré dans ce repo)

- Monorepo Rust + Tauri + SolidJS conforme à l'archi ci-dessus.
- Backend Tauri v2 avec commandes: dashboard, factures, dépenses, assistants TVA/URSSAF, paramètres.
- Infra SQLite locale (fichier `data.sqlite`, migrations SQLx au démarrage).
- Front SolidJS+Tailwind avec pages: Dashboard, Encaissements, Dépenses, TVA, URSSAF, Clôture, Paramètres.

Pour lancer: voir `apps/desktop/README.md` (install deps puis `npx tauri dev`).

CsvBankGateway, CsvInvoiceGateway (Malt mapper)

KeychainGateway (tauri-plugin)

app

Controllers = commandes Tauri exposées #[tauri::command]

Handlers (command/query) orchestrant les use cases.

Couche SolidJS
Layering: component -> hook/store -> usecase -> gateways

Gateways: appeller invoke() Tauri.

Stores: SolidJS Signals pour états (loading, error, data).

Routing: SolidJS Router.

5) Modèle de données (SQLite)
   sql
   Copy
   Edit
   -- invoices (prestations)
   CREATE TABLE invoices (
   id TEXT PRIMARY KEY,
   number TEXT,
   client TEXT,
   service_start DATE,
   service_end DATE,
   amount_ht REAL NOT NULL,
   tva_rate REAL NOT NULL,
   status TEXT CHECK(status IN ('draft','sent','paid')) NOT NULL,
   issued_at DATE NOT NULL,
   paid_at DATE,            -- encaissement ! clé pour TVA/URSSAF
   source TEXT,             -- ex: 'malt'
   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );

-- expenses (charges avec TVA déductible)
CREATE TABLE expenses (
id TEXT PRIMARY KEY,
label TEXT,
category TEXT,
amount_ht REAL NOT NULL,
tva_rate REAL NOT NULL,
paid_at DATE NOT NULL,   -- encaissement fournisseur
proof_path TEXT
);

-- provisions (échéances TVA/URSSAF/etc.)
CREATE TABLE provisions (
id TEXT PRIMARY KEY,
kind TEXT CHECK(kind IN ('TVA','URSSAF','OTHER')) NOT NULL,
period TEXT NOT NULL,       -- '2025-06'
due_date DATE NOT NULL,
amount REAL NOT NULL,
status TEXT CHECK(status IN ('planned','paid','canceled')) NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- config
CREATE TABLE settings (
key TEXT PRIMARY KEY,
value TEXT NOT NULL
);
Vues utiles

sql
Copy
Edit
-- CA encaissé par mois (HT)
CREATE VIEW v_revenue_by_month AS
SELECT strftime('%Y-%m', paid_at) AS ym, SUM(amount_ht) AS ht
FROM invoices WHERE paid_at IS NOT NULL GROUP BY ym;

-- TVA collectée par mois (encaissements)
CREATE VIEW v_tva_collecte AS
SELECT strftime('%Y-%m', paid_at) AS ym, SUM(amount_ht * tva_rate/100) AS tva
FROM invoices WHERE paid_at IS NOT NULL GROUP BY ym;

-- TVA déductible par mois (dépenses payées)
CREATE VIEW v_tva_deductible AS
SELECT strftime('%Y-%m', paid_at) AS ym, SUM(amount_ht * tva_rate/100) AS tva
FROM expenses GROUP BY ym;
6) Flux principaux (UC)
   UC-1 Calcul TVA (mois M)
   Lire v_tva_collecte.ym = M, v_tva_deductible.ym = M

due = max(0, collecte - deductible)

Créer/mettre à jour provision(kind=TVA, period=M, due_date=20/M+1, amount=due)

UC-2 Calcul URSSAF (mois M)
ht = v_revenue_by_month.ht where ym = M

rate = settings['urssaf_rate']

due = ht * rate

Provision URSSAF, due_date=05/(M+1)

UC-3 Rapprochement
Matching heuristique :
abs(tx.amount - expected) < tol ET |tx.date - paid_at| <= window
Marquer facture/dépense matched et set paid_at si manquant.

UC-4 Prévision
Partir du solde initial (saisi ou importé).

Pour chaque mois futur :
solde = solde + encaissements_prévus - provisions_due - charges_fixes.

7) Exemples de code (squelettes minimalistes)
   7.1 Tauri (controller + handler)
   rust
   Copy
   Edit
   // crates/domain/src/types.rs
   use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct VatReport {
pub month: String,            // "2025-06"
pub collected: f64,
pub deductible: f64,
pub due: f64,
pub due_date: String          // "2025-07-20"
}

// crates/domain/src/ports.rs
#[async_trait::async_trait]
pub trait VatRepo {
async fn sum_collected(&self, ym: &str) -> anyhow::Result<f64>;
async fn sum_deductible(&self, ym: &str) -> anyhow::Result<f64>;
}
#[async_trait::async_trait]
pub trait ProvisionRepo {
async fn upsert_tva(&self, ym: &str, due: f64, due_date: &str) -> anyhow::Result<()>;
}
pub trait Clock { fn add_months(&self, ym: &str, months: i32) -> String; }

// crates/domain/src/usecases.rs
pub async fn compute_vat_for_month(
ym: &str, vat: &dyn VatRepo, prov: &dyn ProvisionRepo, clock: &dyn Clock
) -> anyhow::Result<VatReport> {
let collected = vat.sum_collected(ym).await?;
let deductible = vat.sum_deductible(ym).await?;
let due = (collected - deductible).max(0.0);
let m_plus_1 = clock.add_months(ym, 1) + "-20";
prov.upsert_tva(ym, due, &m_plus_1).await?;
Ok(VatReport { month: ym.into(), collected, deductible, due, due_date: m_plus_1 })
}
rust
Copy
Edit
// crates/app/src/controllers.rs
#[tauri::command]
pub async fn api_compute_vat(ym: String, state: tauri::State<'_, AppState>)
-> Result<VatReport, String> {
let r = compute_vat_for_month(&ym, &state.vat_repo, &state.prov_repo, &state.clock)
.await.map_err(|e| e.to_string())?;
Ok(r)
}
rust
Copy
Edit
// apps/desktop/src-tauri/src/main.rs
fn main() {
tauri::Builder::default()
.invoke_handler(tauri::generate_handler![api_compute_vat])
.run(tauri::generate_context!())
.expect("error while running tauri");
}
7.2 SolidJS (gateway -> use case -> component)
```ts
// apps/desktop/src/gateways/tauri.ts
import { invoke } from '@tauri-apps/api/tauri';
export type VatReport = { month:string; collected:number; deductible:number; due:number; due_date:string };

export async function computeVat(ym: string): Promise<VatReport> {
return invoke('api_compute_vat', { ym });
}
```

```ts
// apps/desktop/src/usecases/useComputeVat.ts
import { computeVat, VatReport } from '../gateways/tauri';

export async function useComputeVat(ym: string): Promise<VatReport> {
return computeVat(ym);
}
```

```tsx
// apps/desktop/src/routes/vat/index.tsx
import { createSignal } from 'solid-js';
import { useComputeVat } from '../../usecases/useComputeVat';

export default function VatPage() {
  const [ym, setYm] = createSignal('2025-06');
  const [report, setReport] = createSignal<null | Awaited<ReturnType<typeof useComputeVat>>>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const run = async () => {
    setLoading(true); 
    setError(null);
    try { 
      setReport(await useComputeVat(ym())); 
    }
    catch (e: any) { 
      setError(e?.message ?? 'error'); 
    }
    finally { 
      setLoading(false); 
    }
  };

  return (
    <div class="p-6 space-y-4">
      <div class="flex gap-2">
        <input class="input" value={ym()} onInput={(e) => setYm(e.target.value)}/>
        <button class="btn" onClick={run}>Compute VAT</button>
      </div>
      {loading() && <div>Loading…</div>}
      {error() && <div class="text-red-600">{error()}</div>}
      {report() && (
        <div class="grid grid-cols-4 gap-4">
          <Card label="Collectée" value={report()!.collected}/>
          <Card label="Déductible" value={report()!.deductible}/>
          <Card label="A payer" value={report()!.due}/>
          <Card label="Echéance" value={report()!.due_date}/>
        </div>
      )}
    </div>
  );
}

const Card = (props: {label: string; value: any}) => (
  <div class="rounded-2xl shadow p-4">
    <div class="text-sm opacity-70">{props.label}</div>
    <div class="text-2xl font-semibold">{String(props.value)}</div>
  </div>
);
```
(Les classes .btn/.input viennent de Tailwind + preset/daisyUI si tu veux.)

8) Détails d’implémentation
   Dates paramétrables (settings) :

tva.decl_day=12, tva.pay_day=20, urssaf.pay_day=5

urssaf.rate=0.XX

forecast.buffer_min (ex: 1 mois de charges)

Clôture : soft-lock via table period_locks(period TEXT, locked_at TIMESTAMP).
Écritures modifiées après lock → nécessite “unlock” explicit.

Justificatifs : stockage dans /data/attachments/<uuid> + chemin en DB.

PDF : gabarit HTML Tailwind imprimé via wkhtmltopdf (plus propre pour tableaux).

Import CSV :

Mapping flexible (UI de correspondance colonnes → champs).

Profiles sauvegardés (ex: “Malt CSV”, “Banque X CSV”).

Auto-match :

Score = w1*(Δmontant) + w2*(Δdate) + w3*(similarité libellé) → seuil configurable.

Sécurité :

Option SQLCipher; sinon DB classique + sauvegarde cryptée (.zip) côté app.

Clé chiffrage en Keychain (macOS Keychain, etc.).

Tests :

Tests unitaires sur usecases (TVA, URSSAF, forecast).

Tests d’intégration SQLite en mémoire.

Perf : toutes les listes paginées; index paid_at, category.

9) Planning & critères d’acceptation
   Lot 1 — Base (2–3j)

CRUD invoices/expenses, imports CSV, calcul TVA/URSSAF, provisions, dashboard simple.
OK si calculs mensuels corrects sur datasets fournis + export CSV.

Lot 2 — Rapprochement & clôture (2j)

Auto-match, assistant TVA/URSSAF, lock période, PDF rapports.
OK si workflow mensuel se fait en <5 minutes sans Excel.

Lot 3 — Prévision (1–2j)

Timeline, simulations, “montant à se verser” calculé.
OK si projection affiche au moins 3 mois avec provisions futures.

10) Exemples de règles de calcul (clair & déterministe)
```
    Mois M = 2025-06
    TVA_collectée(M)  = Σ (facture.amount_ht * tva_rate)   where facture.paid_at ∈ [M]
    TVA_déductible(M) = Σ (dépense.amount_ht * tva_rate)   where dépense.paid_at ∈ [M]
    TVA_due(M)        = max(0, collectée - déductible)
    TVA_payable_date  = 20 / (M+1)
    URSSAF_due(M)     = v_revenue_by_month.ht(M) * urssaf_rate
    URSSAF_date       = 05 / (M+1)
```

Disponible_M = Solde_M-1
+ Encaissements_M (HT+TVA) – Dépenses_M (TTC)
– TVA_due(M-1) si payée en M – URSSAF_due(M-1) si payée en M
– Provisions futures M (si tu préfères bloquer immédiatement)
11) Ce qu’il faut fournir au dev
    Ce cahier des charges + jeux d’essai (CSV banque, CSV Malt, CSV dépenses).

Paramètres réels : taux URSSAF, jours d’échéance exacts, buffer souhaité.

Gabarits PDF (logo, mentions obligatoires).

Convention de catégories de dépenses (TVA déductible ou non).

Design tokens Tailwind (palette, radius, shadows).

12) Bonus (facultatif)
    CLI treso (mêmes usecases) pour automatiser “compute-vat 2025-06”, “close 2025-06”.

Connecteurs PSD2 plus tard (Budget Insight, Bridge) si tu veux du live banking.

Rappel local (notif Tauri) X jours avant échéances.
