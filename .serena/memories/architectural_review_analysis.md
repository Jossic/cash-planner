# JLA Cash Planner - Revue Architecturale Complète

## État Actuel de l'Application

### Architecture Technique
- **Backend**: Tauri 2.0 avec Rust, architecture Clean Architecture
- **Frontend**: Migration récente de SolidJS vers React/Next.js (git status montre la transition)
- **Base de données**: SQLite avec migrations
- **Structure**: Monorepo avec séparation claire des couches

### Couches Architecturales Existantes

#### 1. Domain Layer (`crates/domain/`)
**Entités principales**:
- `MonthId` - Identifiant année/mois
- `Invoice` - Factures avec calculs TVA (montants en centimes)
- `Expense` - Dépenses avec TVA déductible 
- `Provision` - Provisions TVA/URSSAF avec échéances
- `Settings` - Configuration (taux en ppm, délais paiement, buffer)
- `BankTx` - Transactions bancaires (pas encore utilisé)

**Use Cases implémentés**:
- `compute_vat_for_month()` - Calcul TVA mensuelle sur encaissements
- `compute_urssaf_for_month()` - Calcul URSSAF basé sur CA encaissé
- `compute_dashboard()` - Résumé mensuel avec disponible
- `compute_month_recap()` - Récap mensuel complet
- `forecast_cashflow()` - Prévisions sur N mois (basique)

#### 2. Application Layer (`crates/app/`)
**Services**:
- `AppService` - Orchestration des use cases
- DTOs pour commandes Tauri (`CreateInvoiceDto`, `CreateInvoiceSimpleDto`)

#### 3. Infrastructure Layer (`crates/infra/`)
**Repositories SQLite** (pas encore implémentés dans le code visible):
- `InvoiceRepo`, `ExpenseRepo`, `ProvisionRepo`
- `ConfigRepo`, `MonthRepo`

#### 4. Frontend (Tauri + SolidJS)
**Pages/Composants actuels**:
- Dashboard avec résumé mensuel
- Gestion factures/dépenses (ajout simple)
- Assistants TVA/URSSAF
- Paramètres
- Modal de préparation déclaration

### Points Forts de l'Architecture Actuelle
1. **Clean Architecture** bien respectée avec séparation des couches
2. **Gestion précise des montants** en centimes (évite erreurs floating-point)
3. **Logique métier française** correcte (TVA sur encaissements, URSSAF)
4. **Local-first** avec SQLite
5. **Types safety** avec Rust et TypeScript

### Lacunes Identifiées par Rapport aux Nouveaux Besoins

#### 1. Modèle de Données Incomplet
- **Manque**: Entités pour jours travaillés, congés, projections annuelles
- **Manque**: Historique des taux journaliers et évolutions
- **Manque**: Catégorisation avancée des dépenses
- **Manque**: Gestion des décalages de paiement (TVA J+20, URSSAF J+5)

#### 2. Use Cases Manquants
- **Simulations**: Calculs de taux journalier optimal, impact congés
- **Projections annuelles**: avec saisonnalité et croissance
- **Optimisation fiscale**: répartition optimale des charges
- **Tableaux de bord avancés**: KPIs, graphiques, tendances

#### 3. Frontend Limité
- **Pas de visualisations**: graphiques, courbes de tendance
- **Pas de saisie mensuelle structurée**: workflow complet de clôture
- **Pas de simulations interactives**: scenarios what-if
- **Navigation basique**: hash router simple

#### 4. Infrastructure Incomplète
- **Pas de backup/restore**: données critiques
- **Pas d'import/export**: transition depuis Excel
- **Pas de validation**: règles métier complexes
- **Pas de cache**: performances sur gros volumes

## Nouveaux Besoins à Intégrer

### 1. Gestion Complète TVA/URSSAF
- Anticipation des échéances avec décalages
- Provisions automatiques avec calendrier
- Optimisation trésorerie

### 2. Visualisations et Graphiques
- Évolution CA mensuel/annuel
- Répartition charges par catégorie
- Comparaisons année N vs N-1
- Projections vs réalisé

### 3. Simulations Avancées
- Impact taux journalier sur résultat annuel
- Optimisation nombre jours travaillés/congés
- Projections avec différents scénarios croissance

### 4. Espace Saisie Mensuelle
- Workflow structuré de clôture mensuelle
- Validation cohérence données
- Rapports automatiques

### 5. Estimation Montants à Mettre de Côté
- Calcul optimal provisions mensuelles
- Lissage charges sur année
- Alertes trésorerie

## Transition depuis Workflow Excel
- Import données historiques Excel
- Mapping correspondances colonnes
- Validation données importées
- Formation utilisateur aux nouveaux workflows