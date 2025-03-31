from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Depends, Request, status
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import tempfile
import aioredis
import os
import uuid
import shutil
import secrets
import logging
from app.config import settings
from datetime import date
from app.utils.file_handler import FileHandler
from app.utils.ocr_engine import ocr_engine
from app.utils.ocr_engine import initialize_ocr_engine, cleanup_ocr_engine
from app.utils.validator import invoice_validator, flag_anomalies
from app.utils.exporter import export_invoices
from app.models import Invoice, ProcessingStatus
from app.utils.data_extractor import data_extractor, extract_invoice_data
from app.utils.data_extractor import initialize_data_extractor, cleanup_data_extractor



app = FastAPI(
    title=settings.PROJECT_NAME, 
    version="1.0.0",
    docs_url=None,  # Disable Swagger UI
    redoc_url=None  # Disable ReDoc UI
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize utilities
file_handler = FileHandler()

# Define models
class ProcessingRequest(BaseModel):
    task_id: str

class ProcessingResponse(BaseModel):
    task_id: str
    status: ProcessingStatus

# Global storage
processing_tasks = {}
direct_results = {}

def get_file_type(filename):
    ext = os.path.splitext(filename)[1].lower()
    if ext == '.pdf':
        return "application/pdf"
    elif ext in ['.jpg', '.jpeg']:
        return "image/jpeg"
    elif ext == '.png':
        return "image/png"
    elif ext == '.zip':
        return "application/zip"
    return None
    
async def process_file_directly(task_id: str, file_path: str, temp_dir: str, project_id: Optional[int] = None):
    logger.info(f"Starting direct processing for task {task_id}" + 
                (f" associated with project {project_id}" if project_id else ""))
    
    try:
        # Set initial status with project_id if provided
        status_info = ProcessingStatus(status="Processing", progress=0, message="Starting processing")
        if project_id:
            status_info.project_id = project_id
        processing_tasks[task_id] = status_info
        
        # Process file
        processed_files = await file_handler.process_upload(file_path)
        logger.info(f"File processed: {file_path}")
        
        # Update progress to 20% (preserve project_id)
        status_info = ProcessingStatus(status="Processing", progress=20, message="File processed")
        if project_id:
            status_info.project_id = project_id
        processing_tasks[task_id] = status_info
        
        all_extracted_data = []
        total_files = len(processed_files)
        
        for i, file_batch in enumerate(processed_files):
            ocr_results = await ocr_engine.process_documents([file_batch])
            batch_data = [Invoice.parse_obj(result) for result in ocr_results.values()]
            all_extracted_data.extend(batch_data)
            
            # Calculate progress between 20% and 60%
            progress = 20 + ((i + 1) / total_files * 40)
            
            # Update progress (preserve project_id)
            status_info = ProcessingStatus(
                status="Processing", 
                progress=int(progress), 
                message=f'Processed {i+1}/{total_files} files'
            )
            if project_id:
                status_info.project_id = project_id
            processing_tasks[task_id] = status_info
        
        logger.info("OCR and Data extraction completed")
        
        # Update progress to 60% (preserve project_id)
        status_info = ProcessingStatus(status="Processing", progress=60, message="OCR and Data extraction completed")
        if project_id:
            status_info.project_id = project_id
        processing_tasks[task_id] = status_info
        
        validation_results = invoice_validator.validate_invoices(all_extracted_data)
        validated_data = [invoice for invoice, _, _ in validation_results]
        validation_warnings = {invoice.invoice_number: warnings for invoice, _, warnings in validation_results}
        
        logger.info("Validation completed")
        
        # Update progress to 80% (preserve project_id)
        status_info = ProcessingStatus(status="Processing", progress=80, message="Validation completed")
        if project_id:
            status_info.project_id = project_id
        processing_tasks[task_id] = status_info
        
        # Update progress to 90% (preserve project_id)
        status_info = ProcessingStatus(status="Processing", progress=90, message="Generating reports")
        if project_id:
            status_info.project_id = project_id
        processing_tasks[task_id] = status_info
        
        flagged_invoices = flag_anomalies(validated_data)
        
        export_data = []
        for invoice in validated_data:
            invoice_data = invoice.dict()
            invoice_data['validation_warnings'] = validation_warnings.get(invoice.invoice_number, [])
            invoice_data['anomaly_flags'] = [flag for flagged in flagged_invoices if flagged['invoice_number'] == invoice.invoice_number for flag in flagged['flags']]
            export_data.append(invoice_data)
        
        invoices = [Invoice.parse_obj(data) for data in export_data]
        csv_output = await export_invoices(invoices, 'csv')
        excel_output = await export_invoices(invoices, 'excel')
        
        csv_path = os.path.join(temp_dir, f"{task_id}_invoices.csv")
        excel_path = os.path.join(temp_dir, f"{task_id}_invoices.xlsx")
        
        with open(csv_path, 'wb') as f:
            f.write(csv_output.getvalue())
        with open(excel_path, 'wb') as f:
            f.write(excel_output.getvalue())
        
        logger.info(f"Processing completed for task {task_id}")
        
        # Create result dictionary with project_id if provided
        result = {
            'progress': 100, 
            'message': 'Processing completed',
            'csv_path': csv_path,
            'excel_path': excel_path,
            'total_invoices': len(validated_data),
            'flagged_invoices': len(flagged_invoices),
            'status': 'Completed',
            'temp_dir': temp_dir,
            'validation_results': validation_warnings,
            'anomalies': flagged_invoices
        }
        
        # Add project_id to result if provided
        if project_id:
            result['project_id'] = project_id
        
        # Final update - completed (preserve project_id)
        status_info = ProcessingStatus(status="Completed", progress=100, message="Processing completed")
        if project_id:
            status_info.project_id = project_id
        processing_tasks[task_id] = status_info
        
        direct_results[task_id] = result
        
        return result
        
    except Exception as e:
        logger.error(f"Error in direct processing: {str(e)}", exc_info=True)
        
        # Update status to failed (preserve project_id)
        status_info = ProcessingStatus(status="Failed", progress=100, message=f"Error: {str(e)}")
        if project_id:
            status_info.project_id = project_id
        processing_tasks[task_id] = status_info
        
        # Create error result with project_id if provided
        error_result = {'status': 'Failed', 'message': str(e)}
        if project_id:
            error_result['project_id'] = project_id
        
        direct_results[task_id] = error_result
        raise

async def process_multiple_files_directly(task_id: str, file_paths: List[str], temp_dir: str, project_id: Optional[int] = None):
    logger.info(f"Starting direct processing for multiple files, task {task_id}" + 
                (f" associated with project {project_id}" if project_id else ""))
    
    try:
        # Set initial status with project_id if provided
        status_info = ProcessingStatus(status="Processing", progress=0, message="Starting processing")
        if project_id:
            status_info.project_id = project_id
        processing_tasks[task_id] = status_info
        
        processed_files = []
        for idx, file_path in enumerate(file_paths):
            processed_files.extend(await file_handler.process_upload(file_path))
            # Calculate progress up to 20%
            progress = ((idx + 1) / len(file_paths) * 20)
            logger.info(f"Processed file {idx + 1} of {len(file_paths)}: {file_path}")
            
            # Update progress (preserve project_id)
            status_info = ProcessingStatus(
                status="Processing", 
                progress=int(progress), 
                message=f'Processed {idx + 1} of {len(file_paths)} files'
            )
            if project_id:
                status_info.project_id = project_id
            processing_tasks[task_id] = status_info
        
        all_extracted_data = []
        total_batches = len(processed_files)
        
        for i, file_batch in enumerate(processed_files):
            ocr_results = await ocr_engine.process_documents([file_batch])
            batch_data = [Invoice.parse_obj(result) for result in ocr_results.values()]
            all_extracted_data.extend(batch_data)
            
            # Calculate progress between 20% and 60%
            progress = 20 + ((i + 1) / total_batches * 40)
            
            # Update progress (preserve project_id)
            status_info = ProcessingStatus(
                status="Processing", 
                progress=int(progress), 
                message=f'Processed {i+1}/{total_batches} batches'
            )
            if project_id:
                status_info.project_id = project_id
            processing_tasks[task_id] = status_info
        
        logger.info("OCR and Data extraction completed")
        
        # Update progress to 60% (preserve project_id)
        status_info = ProcessingStatus(status="Processing", progress=60, message="OCR and Data extraction completed")
        if project_id:
            status_info.project_id = project_id
        processing_tasks[task_id] = status_info
        
        validation_results = invoice_validator.validate_invoices(all_extracted_data)
        validated_data = [invoice for invoice, _, _ in validation_results]
        validation_warnings = {invoice.invoice_number: warnings for invoice, _, warnings in validation_results}
        
        logger.info("Validation completed")
        
        # Update progress to 80% (preserve project_id)
        status_info = ProcessingStatus(status="Processing", progress=80, message="Validation completed")
        if project_id:
            status_info.project_id = project_id
        processing_tasks[task_id] = status_info
        
        # Update progress to 90% (preserve project_id)
        status_info = ProcessingStatus(status="Processing", progress=90, message="Generating reports")
        if project_id:
            status_info.project_id = project_id
        processing_tasks[task_id] = status_info
        
        flagged_invoices = flag_anomalies(validated_data)
        
        export_data = []
        for invoice in validated_data:
            invoice_data = invoice.dict()
            invoice_data['validation_warnings'] = validation_warnings.get(invoice.invoice_number, [])
            invoice_data['anomaly_flags'] = [flag for flagged in flagged_invoices if flagged['invoice_number'] == invoice.invoice_number for flag in flagged['flags']]
            export_data.append(invoice_data)
        
        invoices = [Invoice.parse_obj(data) for data in export_data]
        csv_output = await export_invoices(invoices, 'csv')
        excel_output = await export_invoices(invoices, 'excel')
        
        csv_path = os.path.join(temp_dir, f"{task_id}_invoices.csv")
        excel_path = os.path.join(temp_dir, f"{task_id}_invoices.xlsx")
        
        with open(csv_path, 'wb') as f:
            f.write(csv_output.getvalue())
        with open(excel_path, 'wb') as f:
            f.write(excel_output.getvalue())
        
        logger.info(f"Processing completed for task {task_id}")
        
        # Create result dictionary with project_id if provided
        result = {
            'progress': 100, 
            'message': 'Processing completed',
            'csv_path': csv_path,
            'excel_path': excel_path,
            'total_invoices': len(validated_data),
            'flagged_invoices': len(flagged_invoices),
            'status': 'Completed',
            'temp_dir': temp_dir,
            'validation_results': validation_warnings,
            'anomalies': flagged_invoices
        }
        
        # Add project_id to result if provided
        if project_id:
            result['project_id'] = project_id
        
        # Final update - completed (preserve project_id)
        status_info = ProcessingStatus(status="Completed", progress=100, message="Processing completed")
        if project_id:
            status_info.project_id = project_id
        processing_tasks[task_id] = status_info
        
        direct_results[task_id] = result
        
        return result
        
    except Exception as e:
        logger.error(f"Error in direct processing: {str(e)}", exc_info=True)
        
        # Update status to failed (preserve project_id)
        status_info = ProcessingStatus(status="Failed", progress=100, message=f"Error: {str(e)}")
        if project_id:
            status_info.project_id = project_id
        processing_tasks[task_id] = status_info
        
        # Create error result with project_id if provided
        error_result = {'status': 'Failed', 'message': str(e)}
        if project_id:
            error_result['project_id'] = project_id
        
        direct_results[task_id] = error_result
        raise

# API Endpoints
@app.post("/upload/", response_model=ProcessingRequest)
async def upload_files(
    files: List[UploadFile] = File(...), 
    project_id: Optional[int] = None,  # Add project_id parameter
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    task_id = str(uuid.uuid4())
    
    # Initialize processing status with project_id if provided
    status_info = ProcessingStatus(status="Queued", progress=0, message="Task queued")
    if project_id:
        # Store project_id as an attribute of the status object
        status_info.project_id = project_id
        logger.info(f"Task {task_id} associated with project {project_id}")
    
    processing_tasks[task_id] = status_info
    
    temp_dir = tempfile.mkdtemp()
    file_paths = []

    try:
        for file in files:
            logger.info(f"Processing file: {file.filename}, Content-Type: {file.content_type}")
            file_type = file.content_type or get_file_type(file.filename)
            if not file_type or file_type not in ["application/pdf", "image/jpeg", "image/png", "application/zip"]:
                logger.warning(f"Unsupported file type: {file_type}")
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_type}")
            
            file_path = os.path.join(temp_dir, file.filename)
            try:
                with open(file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                file_paths.append(file_path)
                logger.info(f"File saved successfully: {file_path}")
            except IOError as e:
                logger.error(f"Error saving file {file.filename}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error saving file {file.filename}")

        # Pass project_id to the processing functions
        if len(files) == 1:
            logger.info(f"Processing single file directly: {file_paths[0]}")
            # Update the process_file_directly function call to include project_id
            background_tasks.add_task(process_file_directly, task_id, file_paths[0], temp_dir, project_id)
        else:
            logger.info(f"Processing multiple files directly: {file_paths}")
            # Update the process_multiple_files_directly function call to include project_id
            background_tasks.add_task(process_multiple_files_directly, task_id, file_paths, temp_dir, project_id)
        
        processing_tasks[task_id] = ProcessingStatus(status="Processing", progress=0, message="Processing started")
        if project_id:
            # Preserve the project_id in the updated status
            processing_tasks[task_id].project_id = project_id
            
        logger.info(f"Task {task_id} started for direct processing")
        
        return ProcessingRequest(task_id=task_id)
    except Exception as e:
        logger.error(f"Unexpected error during file upload: {str(e)}", exc_info=True)
        shutil.rmtree(temp_dir)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during file upload: {str(e)}")


@app.get("/status/{task_id}", response_model=ProcessingResponse)
async def get_processing_status(task_id: str):
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    status_info = processing_tasks[task_id]
    return ProcessingResponse(task_id=task_id, status=status_info)

@app.get("/download/{task_id}")
async def download_results(task_id: str, format: str = "csv"):
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task_id not in direct_results:
        raise HTTPException(status_code=400, detail="Processing not completed")
    
    result = direct_results[task_id]
    
    if format.lower() == "csv":
        file_path = os.path.join(result.get('temp_dir', tempfile.gettempdir()), f"{task_id}_invoices.csv")
        media_type = "text/csv"
    elif format.lower() == "excel":
        file_path = os.path.join(result.get('temp_dir', tempfile.gettempdir()), f"{task_id}_invoices.xlsx")
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        raise HTTPException(status_code=400, detail="Invalid format specified")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Result file not found")
    
    return FileResponse(file_path, media_type=media_type, filename=os.path.basename(file_path))

@app.get("/validation/{task_id}")
async def get_validation_results(task_id: str):
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task_id not in direct_results:
        raise HTTPException(status_code=400, detail="Processing not completed")
    
    validation_results = direct_results[task_id].get('validation_results', {})
    return validation_results

@app.get("/anomalies/{task_id}")
async def get_anomalies(task_id: str):
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task_id not in direct_results:
        raise HTTPException(status_code=400, detail="Processing not completed")
    
    anomalies = direct_results[task_id].get('anomalies', [])
    return anomalies

@app.post("/cancel/{task_id}")
async def cancel_task(task_id: str):
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    status_info = processing_tasks[task_id]
    if status_info.status in ['Queued', 'Processing']:
        processing_tasks[task_id] = ProcessingStatus(status="Cancelled", progress=0, message="Task cancelled by user")
        return {"status": "Task cancelled successfully"}
    elif status_info.status in ['Completed', 'Failed']:
        return {"status": "Task already completed or failed, cannot cancel"}
    else:
        return {"status": "Unable to cancel task, unknown state"}

@app.get("/check-task/{task_id}")
def check_task(task_id: str):
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    status_info = processing_tasks[task_id]
    return {
        "task_id": task_id,
        "status": status_info.status,
        "progress": status_info.progress,
        "message": status_info.message
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return RedirectResponse(url="/")  # Redirect to Django's home page

@app.on_event("startup")
async def startup_event():
    try:
        logger.info("=== NEW DEPLOYMENT STARTED ===")
        logger.info("Application is starting up")
        try:
            await initialize_ocr_engine()
            await initialize_data_extractor()
            
            # Global Redis cache clearing
            try:
                redis = await aioredis.from_url(settings.REDIS_URL)
                await redis.flushall()
                logger.info("Global Redis cache cleared on startup")
                await redis.close()
            except Exception as e:
                logger.error(f"Failed to clear Redis cache: {str(e)}")
                
            logger.info("OCR engine and data extractor initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize components: {str(e)}")
    except Exception as e:
        logger.error(f"Error during application startup: {str(e)}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application is shutting down")
    await cleanup_ocr_engine()  
    await cleanup_data_extractor()
    
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))  
    uvicorn.run(app, host="0.0.0.0", port=port)



