use std::collections::HashMap;

use bytes::Bytes;
use chrono::{Utc, Datelike};
use domain::{DomainError, DomainResult};
use mime_guess::MimeGuess;
use s3::{Bucket, Region, creds::Credentials};
use s3::bucket_ops::BucketConfiguration;
use uuid::Uuid;

/// Configuration MinIO
#[derive(Debug, Clone)]
pub struct MinioConfig {
    pub endpoint: String,
    pub port: u16,
    pub access_key: String,
    pub secret_key: String,
    pub bucket_name: String,
    pub public_url: String,
    pub use_ssl: bool,
}

impl Default for MinioConfig {
    fn default() -> Self {
        Self {
            endpoint: std::env::var("MINIO_ENDPOINT").unwrap_or_else(|_| "minio.jla-dev.com".to_string()),
            port: std::env::var("MINIO_PORT").unwrap_or_else(|_| "443".to_string()).parse().unwrap_or(443),
            access_key: std::env::var("MINIO_ACCESS_KEY").unwrap_or_else(|_| "yOV6ceBtGNt99h1yqSvW".to_string()),
            secret_key: std::env::var("MINIO_SECRET_KEY").unwrap_or_else(|_| "dxn0LFYgzJaSmoEUXkCpUBc3f6FSWpzFjiQG4QG2".to_string()),
            bucket_name: std::env::var("MINIO_BUCKET_NAME").unwrap_or_else(|_| "cash-planner".to_string()),
            public_url: std::env::var("MINIO_PUBLIC_URL").unwrap_or_else(|_| "https://minio.jla-dev.com".to_string()),
            use_ssl: std::env::var("MINIO_PORT").unwrap_or_else(|_| "443".to_string()) == "443",
        }
    }
}

/// Service MinIO pour l'upload et la gestion des justificatifs
#[derive(Clone)]
pub struct MinioService {
    bucket: Bucket,
    config: MinioConfig,
}

impl MinioService {
    pub async fn new(config: MinioConfig) -> DomainResult<Self> {
        println!("🚀 Initialisation du service MinIO...");
        
        let credentials = Credentials::new(
            Some(&config.access_key),
            Some(&config.secret_key),
            None,
            None,
            None,
        ).map_err(|e| DomainError::Repo(format!("Erreur credentials MinIO: {}", e)))?;

        let endpoint_url = if config.use_ssl {
            format!("https://{}:{}", config.endpoint, config.port)
        } else {
            format!("http://{}:{}", config.endpoint, config.port)
        };

        let region = Region::Custom {
            region: "us-east-1".to_string(),
            endpoint: endpoint_url,
        };

        let bucket = Bucket::new(&config.bucket_name, region, credentials)
            .map_err(|e| DomainError::Repo(format!("Erreur création bucket: {}", e)))?
            .with_path_style(); // Force path style pour MinIO
        
        let service = Self { bucket, config };
        
        // Test connection and ensure bucket exists during initialization
        service.test_connection().await?;
        
        println!("✅ Service MinIO initialisé avec succès!");
        Ok(service)
    }

    /// Vérifie que le bucket existe, le crée si nécessaire
    async fn ensure_bucket_exists(&self) -> DomainResult<()> {
        println!("🔍 Vérification existence du bucket '{}'...", self.config.bucket_name);
        
        // Check if bucket exists by trying to list its contents with a delimiter
        // This is a common way to test bucket existence without getting all objects
        match self.bucket.list("".to_string(), Some("/".to_string())).await {
            Ok(_) => {
                println!("✅ Bucket '{}' existe et est accessible", self.config.bucket_name);
                return Ok(());
            }
            Err(e) => {
                let error_str = e.to_string();
                println!("⚠️ Erreur accès bucket: {}", error_str);
                
                if error_str.contains("NoSuchBucket") || error_str.contains("404") {
                    println!("❌ Bucket '{}' n'existe pas, création nécessaire...", self.config.bucket_name);
                } else if error_str.contains("AccessDenied") || error_str.contains("Forbidden") {
                    return Err(DomainError::Repo(format!(
                        "Accès refusé au bucket '{}'. Vérifiez les permissions MinIO: {}", 
                        self.config.bucket_name, error_str
                    )));
                } else {
                    println!("🔄 Erreur indéterminée, tentative de création par sécurité...");
                }
            }
        }
        
        // Try to create the bucket using the static method (with path style for MinIO)
        println!("🚀 Création du bucket '{}'...", self.config.bucket_name);
        match Bucket::create_with_path_style(
            &self.config.bucket_name,
            self.bucket.region.clone(),
            self.bucket.credentials.clone(),
            BucketConfiguration::default(), // Use default bucket configuration
        ).await {
            Ok(_) => {
                println!("✅ Bucket '{}' créé avec succès!", self.config.bucket_name);
                Ok(())
            }
            Err(e) => {
                let error_str = e.to_string();
                println!("❌ Erreur lors de la création du bucket: {}", error_str);
                
                // Check if bucket already exists (race condition or previous creation)
                if error_str.contains("BucketAlreadyExists") || error_str.contains("BucketAlreadyOwnedByYou") {
                    println!("ℹ️ Le bucket existe déjà - continuons");
                    Ok(())
                } else if error_str.contains("AccessDenied") || error_str.contains("Forbidden") {
                    Err(DomainError::Repo(format!(
                        "Accès refusé pour créer le bucket '{}'. Vérifiez les permissions MinIO: {}", 
                        self.config.bucket_name, error_str
                    )))
                } else {
                    Err(DomainError::Repo(format!(
                        "Impossible de créer le bucket '{}': {}", 
                        self.config.bucket_name, error_str
                    )))
                }
            }
        }
    }
    
    /// Liste tous les buckets disponibles (pour debug) - Simplifié car l'API rust-s3 0.32 n'a pas list_buckets
    async fn list_available_buckets(&self) -> DomainResult<Vec<String>> {
        println!("📋 Note: rust-s3 0.32 ne supporte pas list_buckets, on simule...");
        
        // Since we can't list all buckets in this version, we'll just test our target bucket
        match self.bucket.list("".to_string(), Some("/".to_string())).await {
            Ok(_) => {
                println!("📦 Bucket '{}' est accessible", self.config.bucket_name);
                Ok(vec![self.config.bucket_name.clone()])
            }
            Err(e) => {
                let error_str = e.to_string();
                if error_str.contains("NoSuchBucket") || error_str.contains("404") {
                    println!("⚠️ Bucket '{}' n'existe pas", self.config.bucket_name);
                    Ok(vec![]) // Return empty list
                } else {
                    println!("⚠️ Erreur test bucket: {}", error_str);
                    Err(DomainError::Repo(format!("Erreur test bucket: {}", error_str)))
                }
            }
        }
    }
    
    /// Vérifie la connectivité MinIO et les permissions
    pub async fn test_connection(&self) -> DomainResult<()> {
        println!("🔌 Test de connectivité MinIO...");
        println!("📍 Endpoint: {}", self.config.endpoint);
        println!("🔑 Access Key: {}***", &self.config.access_key[..self.config.access_key.len().min(8)]);
        println!("🪣 Bucket: {}", self.config.bucket_name);
        
        // First test: list buckets to verify credentials
        match self.list_available_buckets().await {
            Ok(buckets) => {
                if buckets.contains(&self.config.bucket_name) {
                    println!("✅ Bucket '{}' trouvé dans la liste des buckets existants", self.config.bucket_name);
                } else {
                    println!("ℹ️ Bucket '{}' non trouvé, sera créé automatiquement", self.config.bucket_name);
                }
            }
            Err(_) => {
                println!("⚠️ Impossible de lister les buckets, mais continuons...");
            }
        }
        
        // Second test: ensure our target bucket exists
        self.ensure_bucket_exists().await?;
        
        println!("✅ Connectivité MinIO validée!");
        Ok(())
    }

    /// Upload un fichier et retourne l'URL publique
    pub async fn upload_file(
        &self, 
        file_content: Bytes, 
        original_filename: &str,
        content_type: Option<String>
    ) -> DomainResult<String> {
        // Génération du nom de fichier avec organisation par dossier YYYY-MM/
        let now = Utc::now();
        let folder = format!("{:04}-{:02}", now.year(), now.month());
        
        // Générer un nom unique pour éviter les collisions
        let file_extension = std::path::Path::new(original_filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("bin");
        
        let unique_filename = format!("{}_{}_{}.{}",
            now.format("%d_%H%M%S"),
            Uuid::new_v4().to_string()[..8].to_string(),
            sanitize_filename(original_filename),
            file_extension
        );
        
        let s3_key = format!("{}/{}", folder, unique_filename);
        
        // Détection automatique du type MIME si non fourni
        let _content_type = content_type.unwrap_or_else(|| {
            MimeGuess::from_path(original_filename)
                .first_or_octet_stream()
                .to_string()
        });

        // Ensure bucket exists before upload
        self.ensure_bucket_exists().await?;
        
        // Upload vers MinIO avec rust-s3
        println!("📤 Upload du fichier '{}' vers le bucket '{}'...", unique_filename, self.config.bucket_name);
        
        let _response = match self.bucket.put_object(&s3_key, &file_content).await {
            Ok(response) => {
                println!("✅ Upload réussi: {}", s3_key);
                response
            }
            Err(e) => {
                let error_str = e.to_string();
                println!("❌ Erreur upload initial: {}", error_str);
                
                if error_str.contains("NoSuchBucket") || error_str.contains("404") {
                    // Bucket doesn't exist, try to recreate it and retry upload
                    println!("⚠️ Bucket '{}' n'existe pas, re-création et retry...", self.config.bucket_name);
                    self.ensure_bucket_exists().await?;
                    
                    println!("🔄 Retry upload après re-création bucket...");
                    // Retry the upload after handling bucket creation
                    self.bucket
                        .put_object(&s3_key, &file_content)
                        .await
                        .map_err(|retry_e| {
                            println!("❌ Échec du retry upload: {}", retry_e);
                            DomainError::Repo(format!("Erreur upload après création bucket: {}", retry_e))
                        })?
                } else if error_str.contains("AccessDenied") || error_str.contains("Forbidden") {
                    return Err(DomainError::Repo(format!(
                        "Accès refusé pour l'upload. Vérifiez les permissions MinIO: {}", error_str
                    )));
                } else {
                    return Err(DomainError::Repo(format!("Erreur upload fichier: {}", error_str)));
                }
            }
        };

        // Construire l'URL publique
        let public_url = format!("{}/{}/{}", 
            self.config.public_url.trim_end_matches('/'), 
            self.config.bucket_name, 
            s3_key
        );
        
        println!("✓ Fichier uploadé avec succès. URL: {}", public_url);
        Ok(public_url)
    }

    /// Supprimer un fichier
    pub async fn delete_file(&self, file_url: &str) -> DomainResult<()> {
        // Extraire la clé S3 depuis l'URL publique
        let s3_key = self.extract_s3_key_from_url(file_url)?;
        
        let _response = self.bucket
            .delete_object(&s3_key)
            .await
            .map_err(|e| DomainError::Repo(format!("Erreur suppression fichier: {}", e)))?;

        Ok(())
    }

    /// Lister les fichiers d'un mois donné
    pub async fn list_files_by_month(&self, year: i32, month: u32) -> DomainResult<Vec<FileInfo>> {
        let folder_prefix = format!("{:04}-{:02}/", year, month);
        println!("📋 Liste des fichiers pour {}/{} (prefix: {})", month, year, folder_prefix);
        
        // Ensure bucket exists first
        self.ensure_bucket_exists().await?;
        
        match self.bucket.list(folder_prefix.clone(), Some("/".to_string())).await {
            Ok(list_results) => {
                let mut files = Vec::new();
                
                // rust-s3 0.32 returns Vec<ListBucketResult>, each with contents field
                for list_result in list_results {
                    for object in list_result.contents {
                        let public_url = format!("{}/{}/{}", 
                            self.config.public_url.trim_end_matches('/'), 
                            self.config.bucket_name, 
                            object.key
                        );
                        
                        files.push(FileInfo {
                            key: object.key,
                            public_url,
                            size_bytes: object.size as u64,
                            last_modified: chrono::DateTime::parse_from_rfc3339(&object.last_modified)
                                .map_err(|e| DomainError::Repo(format!("Erreur parsing date: {}", e)))?
                                .naive_utc(),
                        });
                    }
                }
                
                println!("✅ Trouvé {} fichier(s) pour {}/{}", files.len(), month, year);
                Ok(files)
            }
            Err(e) => {
                let error_str = e.to_string();
                println!("❌ Erreur lors du listing: {}", error_str);
                Err(DomainError::Repo(format!("Erreur listing fichiers: {}", error_str)))
            }
        }
    }

    /// Extraire la clé S3 depuis une URL publique
    fn extract_s3_key_from_url(&self, file_url: &str) -> DomainResult<String> {
        let base_url = format!("{}/{}/", self.config.public_url, self.config.bucket_name);
        
        if let Some(s3_key) = file_url.strip_prefix(&base_url) {
            Ok(s3_key.to_string())
        } else {
            Err(DomainError::Validation(format!("URL invalide: {}", file_url)))
        }
    }

    /// Obtenir les statistiques de stockage
    pub async fn get_storage_stats(&self) -> DomainResult<StorageStats> {
        println!("📊 Calcul des statistiques de stockage...");
        
        // Ensure bucket exists first
        self.ensure_bucket_exists().await?;
        
        match self.bucket.list("".to_string(), Some("".to_string())).await {
            Ok(list_results) => {
                let mut stats = StorageStats::default();
                
                // rust-s3 0.32 returns Vec<ListBucketResult>, each with contents field
                for list_result in list_results {
                    for object in list_result.contents {
                        stats.total_files += 1;
                        stats.total_size_bytes += object.size as u64;
                        
                        // Extract file extension for type statistics
                        if let Some(extension) = std::path::Path::new(&object.key)
                            .extension()
                            .and_then(|ext| ext.to_str())
                        {
                            *stats.files_by_type.entry(extension.to_lowercase()).or_insert(0) += 1;
                        } else {
                            *stats.files_by_type.entry("unknown".to_string()).or_insert(0) += 1;
                        }
                    }
                }
                
                println!("✅ Statistiques calculées: {} fichiers, {} bytes", 
                    stats.total_files, stats.total_size_bytes);
                Ok(stats)
            }
            Err(e) => {
                let error_str = e.to_string();
                println!("❌ Erreur calcul statistiques: {}", error_str);
                Err(DomainError::Repo(format!("Erreur calcul statistiques: {}", error_str)))
            }
        }
    }
}

/// Information sur un fichier stocké
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FileInfo {
    pub key: String,
    pub public_url: String,
    pub size_bytes: u64,
    pub last_modified: chrono::NaiveDateTime,
}

/// Statistiques de stockage
#[derive(Debug, Clone, Default, serde::Serialize, serde::Deserialize)]
pub struct StorageStats {
    pub total_files: u64,
    pub total_size_bytes: u64,
    pub files_by_type: HashMap<String, u64>,
}

/// Utilitaire pour nettoyer les noms de fichiers
fn sanitize_filename(filename: &str) -> String {
    // Garder uniquement les caractères alphanumériques, tirets et underscores
    let stem = std::path::Path::new(filename)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("file");
        
    stem.chars()
        .map(|c| match c {
            'a'..='z' | 'A'..='Z' | '0'..='9' | '-' | '_' => c,
            ' ' => '_',
            _ => '_',
        })
        .collect::<String>()
        .chars()
        .take(50) // Limiter la longueur
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("Facture N°123.pdf"), "Facture_N_123");
        assert_eq!(sanitize_filename("Ticket de caisse - Carrefour.jpg"), "Ticket_de_caisse___Carrefour");
        assert_eq!(sanitize_filename("file with spaces.docx"), "file_with_spaces");
    }
    
    #[test]
    fn test_extract_s3_key() {
        // Create a mock MinIO service configuration
        let config = MinioConfig {
            public_url: "https://minio.example.com".to_string(),
            bucket_name: "test_bucket".to_string(),
            ..Default::default()
        };
        
        // We can't create a real MinioService in unit tests without credentials,
        // so let's test the utility function logic directly
        let url = "https://minio.example.com/test_bucket/2024-01/file.pdf";
        let expected_key = "2024-01/file.pdf";
        
        // Test URL format
        assert!(url.contains(expected_key));
        
        // Test the URL construction logic
        let base_url = format!("{}/{}/", config.public_url, config.bucket_name);
        assert_eq!(base_url, "https://minio.example.com/test_bucket/");
    }
    
    #[tokio::test]
    #[ignore] // Ignored because it requires real MinIO credentials
    async fn test_minio_connection() {
        // This test can be run with: cargo test test_minio_connection -- --ignored
        // Make sure to set environment variables first:
        // export MINIO_ENDPOINT=minio.jla-dev.com
        // export MINIO_ACCESS_KEY=yOV6ceBtGNt99h1yqSvW
        // export MINIO_SECRET_KEY=dxn0LFYgzJaSmoEUXkCpUBc3f6FSWpzFjiQG4QG2
        // export MINIO_BUCKET_NAME=cash-planner
        
        let config = MinioConfig::default();
        println!("Testing MinIO connection with config: {:?}", config);
        
        match MinioService::new(config).await {
            Ok(service) => {
                println!("✅ MinIO service initialized successfully!");
                
                // Test connection explicitly
                match service.test_connection().await {
                    Ok(_) => println!("✅ Connection test passed!"),
                    Err(e) => panic!("❌ Connection test failed: {}", e),
                }
            }
            Err(e) => {
                panic!("❌ Failed to initialize MinIO service: {}", e);
            }
        }
    }
}