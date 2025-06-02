from datetime import datetime
from typing import List, Optional
from bson import ObjectId

from core.database import get_database
from models.log import ObjectType, OperationType
from models.config import SystemConfig, SystemConfigCreate, SystemConfigUpdate, SystemConfigInDB
from utils.logging_utils import record_operation_log

import logging

logger = logging.getLogger(__name__)

class SystemConfigService:
    def __init__(self):
        self.collection_name = "configurations"

    async def get_configs(self, skip: int = 0, limit: int = 100) -> List[SystemConfigInDB]:
        """
        Get all system configurations with pagination
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of system configurations
        """
        try:
            db = await get_database()
            cursor = db[self.collection_name].find().skip(skip).limit(limit)
            configs = await cursor.to_list(length=limit)
            return [SystemConfigInDB(**config) for config in configs]
        except Exception as e:
            logger.error(f"Error getting configurations: {str(e)}")
            raise

    async def get_config(self, key: str) -> Optional[SystemConfigInDB]:
        """
        Get a single system configuration by key
        
        Args:
            key: Configuration key
            
        Returns:
            System configuration if found, None otherwise
        """
        try:
            db = await get_database()
            config = await db[self.collection_name].find_one({"key": key})
            return SystemConfigInDB(**config) if config else None
        except Exception as e:
            logger.error(f"Error getting configuration {key}: {str(e)}")
            raise

    async def create_config(self, config: SystemConfigCreate, creator_id: str, creator_name: str) -> SystemConfigInDB:
        """
        Create a new system configuration
        
        Args:
            config: Configuration data
            user: User information (must contain user_id and user_name)
            
        Returns:
            Created system configuration
            
        Raises:
            ValueError: If configuration with key already exists
        """
        try:
            db = await get_database()
            
            # Check if key already exists
            existing = await self.get_config(config.key)
            if existing:
                raise ValueError(f"Configuration with key '{config.key}' already exists")

            # Prepare document
            config_dict = config.model_dump()
            config_dict.update({
                "created_at": datetime.utcnow(),
                "creator_id": creator_id,
                "creator_name": creator_name,
                "updated_at": datetime.utcnow(),
                "updater_id": creator_id,
                "updater_name": creator_name
            })

            # Insert document
            result = await db[self.collection_name].insert_one(config_dict)
            
            # Get created document
            created_config = await db[self.collection_name].find_one({"_id": result.inserted_id})
            
            # Convert to dict and remove ObjectId
            config_for_log = {k: str(v) if isinstance(v, ObjectId) else v for k, v in created_config.items()}
            
            # Add log record
            await record_operation_log(
                object_type=ObjectType.CONFIGURATION,
                object_id=config.key,
                object_data=config_for_log,
                operation_type=OperationType.CREATE,
                user_id=creator_id,
                user_name=creator_name
            )
            
            return SystemConfigInDB(**created_config)
        except ValueError as e:
            logger.warning(f"Validation error creating configuration: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error creating configuration: {str(e)}")
            raise

    async def update_config(self, key: str, config: SystemConfigUpdate, updater_id: str, updater_name: str) -> Optional[SystemConfigInDB]:
        """
        Update a system configuration
        
        Args:
            key: Configuration key
            config: Updated configuration data
            user: User information (must contain user_id and user_name)
            
        Returns:
            Updated system configuration if found, None otherwise
        """
        try:
            db = await get_database()
            
            # Prepare update data
            update_data = {
                "$set": {
                    "value": config.value,
                    "updated_at": datetime.utcnow(),
                    "updater_id": updater_id,
                    "updater_name": updater_name
                }
            }

            # Update document
            result = await db[self.collection_name].find_one_and_update(
                {"key": key},
                update_data,
                return_document=True
            )

            if result:
                # Convert to dict and remove ObjectId
                config_for_log = {k: str(v) if isinstance(v, ObjectId) else v for k, v in result.items()}
                
                # Add log record
                await record_operation_log(
                    object_type=ObjectType.CONFIGURATION,
                    object_id=key,
                    object_data=config_for_log,
                    operation_type=OperationType.UPDATE,
                    user_id=updater_id,
                    user_name=updater_name
                )
                
                return SystemConfigInDB(**result)
            return None
        except Exception as e:
            logger.error(f"Error updating configuration {key}: {str(e)}")
            raise

    async def delete_config(self, key: str, user_id: str, user_name: str) -> bool:
        """
        Delete a system configuration
        
        Args:
            key: Configuration key
            user: User information (must contain user_id and user_name)
            
        Returns:
            True if configuration was deleted, False otherwise
        """
        try:
            db = await get_database()
            
            # Get config before deletion for logging
            config = await db[self.collection_name].find_one({"key": key})
            if not config:
                return False
                
            # Convert to dict and remove ObjectId
            config_for_log = {k: str(v) if isinstance(v, ObjectId) else v for k, v in config.items()}
                
            # Delete document
            result = await db[self.collection_name].delete_one({"key": key})
            
            if result.deleted_count > 0:
                # Add log record
                await record_operation_log(
                    object_type=ObjectType.CONFIGURATION,
                    object_id=key,
                    object_data=config_for_log,
                    operation_type=OperationType.DELETE,
                    user_id=user_id,
                    user_name=user_name
                )
                
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting configuration {key}: {str(e)}")
            raise

# Create a singleton instance
config_service = SystemConfigService() 