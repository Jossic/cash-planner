// Script de test pour vérifier l'ouverture d'URL
// Peut être exécuté dans la console du développeur de l'application Tauri

console.log('🔗 Test de l\'ouverture d\'URL MinIO...')

// URL de test (exemple)
const testUrl = 'https://minio.jla-dev.com/cash-planner/2025-08/14_175726_e5fe82b3_Facture_Freelance_De_veloppeur_Fullstack_Juil_2025.pdf'

// Test avec la commande Tauri
async function testTauriOpener() {
  try {
    console.log('🧪 Test 1: Via commande Tauri cmd_open_url')
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('cmd_open_url', { url: testUrl })
    console.log('✅ Test 1 réussi: URL ouverte via Tauri')
  } catch (error) {
    console.error('❌ Test 1 échoué:', error)
  }
}

// Test avec le module fileOpener
async function testFileOpener() {
  try {
    console.log('🧪 Test 2: Via module fileOpener')
    // Note: Vous devrez importer le module selon votre environnement
    // await openMinioJustificatif(testUrl)
    console.log('✅ Test 2 prêt (importer d\'abord le module fileOpener)')
  } catch (error) {
    console.error('❌ Test 2 échoué:', error)
  }
}

// Test fallback avec window.open
function testFallback() {
  try {
    console.log('🧪 Test 3: Fallback avec window.open')
    window.open(testUrl, '_blank')
    console.log('✅ Test 3 réussi: URL ouverte en fallback')
  } catch (error) {
    console.error('❌ Test 3 échoué:', error)
  }
}

// Lancer tous les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests d\'ouverture d\'URL...')
  await testTauriOpener()
  await testFileOpener()
  testFallback()
  console.log('🏁 Tests terminés')
}

// Exposer les fonctions globalement pour utilisation dans la console
window.testOpener = {
  testTauriOpener,
  testFileOpener,
  testFallback,
  runAllTests,
  testUrl
}

console.log('🎯 Pour tester, utilisez: window.testOpener.runAllTests()')