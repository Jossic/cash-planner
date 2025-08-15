# Correction de l'ouverture des PDFs MinIO

## Problème résolu

Le clic sur les documents PDF dans la liste des opérations n'ouvrait pas les fichiers à cause de l'utilisation d'une méthode dépréciée (`tauri_plugin_shell::ShellExt::open()`).

## Solutions implémentées

### 1. Migration vers `tauri-plugin-opener` (recommandé)

- ✅ **Cargo.toml** : Ajout de `tauri-plugin-opener = "2"`
- ✅ **package.json** : Ajout de `@tauri-apps/plugin-opener`
- ✅ **tauri.conf.json** : Configuration des permissions `opener:allow-open-url` et `opener:allow-default-urls`
- ✅ **main.rs** : 
  - Remplacement de `tauri_plugin_shell::ShellExt::open()` par `tauri_plugin_opener::OpenerExt::open_url()`
  - Ajout de l'initialisation du plugin avec `.plugin(tauri_plugin_opener::init())`
  - Amélioration des logs et gestion d'erreurs dans `cmd_open_url`

### 2. Amélioration du frontend

- ✅ **fileOpener.ts** : Nouveau module utilitaire avec validation et fallback
- ✅ **OperationsList.tsx** : Utilisation du nouveau module avec gestion d'erreurs améliorée
- ✅ Validation des URLs MinIO
- ✅ Fallback automatique vers `window.open()` en cas d'échec

### 3. Debugging et logs

- ✅ Logs détaillés dans la commande Rust `cmd_open_url`
- ✅ Validation des formats d'URL (http://, https://, file://)
- ✅ Messages d'erreur descriptifs
- ✅ Script de test (`test_opener.js`) pour diagnostiquer les problèmes

## Comment tester

### Dans l'application Tauri

1. **Ouvrir l'application** : `npm run desktop:dev`
2. **Aller à la page Opérations** 
3. **Cliquer sur l'icône 📄 (FileText)** d'une opération avec justificatif
4. **Vérifier** que le PDF s'ouvre dans l'application par défaut

### Depuis la console développeur

1. **Ouvrir les DevTools** de l'application Tauri (F12)
2. **Coller le code de test** depuis `test_opener.js`
3. **Exécuter** : `window.testOpener.runAllTests()`
4. **Observer** les logs et résultats

### URLs de test

```javascript
// URL d'exemple MinIO
const testUrl = 'https://minio.jla-dev.com/cash-planner/2025-08/14_175726_e5fe82b3_Facture_Freelance_De_veloppeur_Fullstack_Juil_2025.pdf'

// Test direct
await invoke('cmd_open_url', { url: testUrl })
```

## Logs de diagnostic

Les logs Rust sont maintenant visibles dans la console Tauri :

```
🔗 [cmd_open_url] Tentative d'ouverture de l'URL: https://...
✅ [cmd_open_url] URL ouverte avec succès: https://...
```

En cas d'erreur :

```
❌ [cmd_open_url] Échec d'ouverture de l'URL '...': ...
📋 [cmd_open_url] Détails de l'erreur:
   - URL: https://...
   - Type d'erreur: ...
   - Plugin utilisé: tauri-plugin-opener v2
```

## Fallbacks disponibles

1. **Principal** : `tauri_plugin_opener::OpenerExt::open_url()`
2. **Fallback** : `window.open(url, '_blank')` (URLs HTTP uniquement)

## Fichiers modifiés

### Backend (Rust)
- `/Cargo.toml` - Ajout dépendance workspace
- `/apps/desktop/src-tauri/Cargo.toml` - Ajout dépendance locale
- `/apps/desktop/src-tauri/tauri.conf.json` - Permissions
- `/apps/desktop/src-tauri/src/main.rs` - Implémentation

### Frontend (TypeScript)
- `/apps/desktop/frontend/package.json` - Dépendance JS
- `/apps/desktop/frontend/src/lib/fileOpener.ts` - Module utilitaire
- `/apps/desktop/frontend/src/components/operations/OperationsList.tsx` - Usage

### Fichiers de test/documentation
- `/test_opener.js` - Script de test
- `/CORRECTION_OUVERTURE_PDF.md` - Cette documentation

## Avantages de la solution

1. **Conforme aux recommandations** : Utilise le plugin officiel recommandé
2. **Meilleure gestion d'erreurs** : Logs détaillés et fallbacks
3. **Cross-platform** : Fonctionne sur tous les OS supportés par Tauri
4. **Sécurisé** : Permissions explicites configurées
5. **Maintenable** : Code moderne et bien structuré

## Note importante

Cette solution remplace définitivement l'ancienne méthode dépréciée. Le warning Rust `"Use tauri-plugin-opener instead"` ne devrait plus apparaître.