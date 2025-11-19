import uvicorn
import logging
from pathlib import Path
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('backend.log')
    ]
)

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("=" * 80)
    logger.info("Starting Real-Time Pairs Trading Analytics Platform")
    logger.info("=" * 80)
    logger.info("Backend Server Configuration:")
    logger.info("  - Host: 0.0.0.0")
    logger.info("  - Port: 8000")
    logger.info("  - Reload: Enabled")
    logger.info("  - API Docs: http://localhost:8000/docs")
    logger.info("  - Health Check: http://localhost:8000/health")
    logger.info("=" * 80)

    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=False,  # Disabled to prevent constant reloading
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        logger.info("\nShutting down gracefully...")
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise
