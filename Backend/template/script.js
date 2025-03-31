// Set empty BASE_URL for relative paths
const BASE_URL = "";
let apiKey = API_KEY;
let currentTaskId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const cancelButton = document.getElementById('cancel-button');
    const resultContent = document.getElementById('result-content');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const errorDisplay = document.getElementById('error-display');
    const apiKeyStatus = document.getElementById('api-key-status');

    // Check API key
    if (!apiKey) {
        apiKeyStatus.style.display = 'block';
        apiKeyStatus.textContent = 'Warning: API key not detected. Some features may be limited.';
    } else {
        apiKeyStatus.style.display = 'none';
    }

    // Define showError function
    function showError(message) {
        errorDisplay.style.display = 'block';
        errorDisplay.textContent = message;
        progressBar.style.width = '0%';
        progressText.textContent = 'Error';
    }

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const files = fileInput.files;

        if (files.length === 0) {
            showError('Please select at least one file to upload.');
            return;
        }

        // Check file types
        for (let file of files) {
            const fileType = file.type;
            if (!['application/pdf', 'image/jpeg', 'image/png', 'application/zip'].includes(fileType)) {
                showError(`Unsupported file type: ${fileType}. Please upload PDF, JPEG, PNG, or ZIP files only.`);
                return;
            }
        }

        uploadButton.disabled = true;
        cancelButton.disabled = false;
        resultContent.innerHTML = '';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        errorDisplay.style.display = 'none';

        const formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }

        const maxWaitTime = 300000; // 5 minutes in milliseconds
        const startTime = Date.now();

        try {
            // Debug logs
            console.log("About to send request");
            console.log("Files:", fileInput.files);
            console.log("FormData created", Array.from(formData.entries()));
            
            // Use XMLHttpRequest for upload instead of fetch
            const uploadResult = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.open('POST', '/upload/', true);
                xhr.setRequestHeader('X-API-Key', apiKey);
                
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            resolve(result);
                        } catch (e) {
                            reject(new Error(`Invalid JSON response: ${xhr.responseText}`));
                        }
                    } else {
                        reject(new Error(`Server error (${xhr.status}): ${xhr.responseText}`));
                    }
                };
                
                xhr.onerror = function() {
                    console.error("XHR Error:", xhr.statusText);
                    reject(new Error("Network error occurred"));
                };
                
                xhr.upload.onprogress = function(e) {
                    if (e.lengthComputable) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100);
                        progressBar.style.width = `${percentComplete}%`;
                        progressText.textContent = `${percentComplete}% - Uploading...`;
                    }
                };
                
                xhr.send(formData);
            });

            currentTaskId = uploadResult.task_id;
            
            resultContent.innerHTML = `<p>Upload successful. Task ID: ${currentTaskId}</p>`;

            // Poll for status
            let processingComplete = false;
            while (!processingComplete) {
                // Check for timeout
                if (Date.now() - startTime > maxWaitTime) {
                    throw new Error('Processing timed out after 5 minutes');
                }

                // Use XMLHttpRequest for status
                const statusResult = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', `/status/${currentTaskId}`, true);
                    xhr.setRequestHeader('X-API-Key', apiKey);
                    
                    xhr.onload = function() {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const result = JSON.parse(xhr.responseText);
                                resolve(result);
                            } catch (e) {
                                reject(new Error(`Invalid JSON response: ${xhr.responseText}`));
                            }
                        } else {
                            reject(new Error(`Server error (${xhr.status}): ${xhr.responseText}`));
                        }
                    };
                    
                    xhr.onerror = function() {
                        reject(new Error("Network error occurred"));
                    };
                    
                    xhr.send();
                });

                const status = statusResult.status;

                // Update progress bar and text
                progressBar.style.width = `${status.progress}%`;
                progressText.textContent = `${status.progress}% - ${status.message}`;

                if (status.status === 'Completed') {
                    processingComplete = true;
                } else if (status.status === 'Failed') {
                    throw new Error(`Processing failed: ${status.message}`);
                } else {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
                }
            }

            // Fetch results
            resultContent.innerHTML += '<p>Processing complete. Downloading results...</p>';
            
            try {
                await downloadResults('csv');
                resultContent.innerHTML += '<p>CSV results downloaded.</p>';
            } catch (error) {
                resultContent.innerHTML += `<p>Error downloading CSV: ${error.message}</p>`;
            }
            
            try {
                await downloadResults('excel');
                resultContent.innerHTML += '<p>Excel results downloaded.</p>';
            } catch (error) {
                resultContent.innerHTML += `<p>Error downloading Excel: ${error.message}</p>`;
            }

            // Fetch and display validation results
            try {
                const validationResults = await fetchValidationResults();
                displayValidationResults(validationResults);
            } catch (error) {
                resultContent.innerHTML += `<p>Error fetching validation results: ${error.message}</p>`;
            }

            // Fetch and display anomalies
            try {
                const anomalies = await fetchAnomalies();
                displayAnomalies(anomalies);
            } catch (error) {
                resultContent.innerHTML += `<p>Error fetching anomalies: ${error.message}</p>`;
            }

            resultContent.innerHTML += '<p>All processing complete.</p>';

        } catch (error) {
            console.error('Error:', error);
            showError(`Error: ${error.message}`);
        } finally {
            uploadButton.disabled = false;
            cancelButton.disabled = true;
            currentTaskId = null;
        }
    });

    cancelButton.addEventListener('click', async () => {
        if (currentTaskId) {
            try {
                // Use XMLHttpRequest for cancel
                const result = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', `/cancel/${currentTaskId}`, true);
                    xhr.setRequestHeader('X-API-Key', apiKey);
                    
                    xhr.onload = function() {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const result = JSON.parse(xhr.responseText);
                                resolve(result);
                            } catch (e) {
                                reject(new Error(`Invalid JSON response: ${xhr.responseText}`));
                            }
                        } else {
                            reject(new Error(`Server error (${xhr.status}): ${xhr.responseText}`));
                        }
                    };
                    
                    xhr.onerror = function() {
                        reject(new Error("Network error occurred"));
                    };
                    
                    xhr.send();
                });
                
                resultContent.innerHTML = `<p>${result.status}</p>`;
                progressBar.style.width = '0%';
                progressText.textContent = 'Cancelled';
                uploadButton.disabled = false;
                cancelButton.disabled = true;
                currentTaskId = null;
            } catch (error) {
                console.error('Error cancelling task:', error);
                showError(`Error cancelling task: ${error.message}`);
            }
        }
    });

    async function downloadResults(format) {
        try {
            // Use XMLHttpRequest for download
            const blob = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', `/download/${currentTaskId}?format=${format}`, true);
                xhr.setRequestHeader('X-API-Key', apiKey);
                xhr.responseType = 'blob';
                
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(xhr.response);
                    } else {
                        // Try to read error message from blob
                        const reader = new FileReader();
                        reader.onload = function() {
                            reject(new Error(`Failed to download ${format} results: ${reader.result}`));
                        };
                        reader.onerror = function() {
                            reject(new Error(`Failed to download ${format} results: Status ${xhr.status}`));
                        };
                        reader.readAsText(xhr.response);
                    }
                };
                
                xhr.onerror = function() {
                    reject(new Error(`Network error while downloading ${format}`));
                };
                
                xhr.send();
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = format === 'excel' ? 'ocr_results.xlsx' : 'ocr_results.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            throw error;
        }
    }

    async function fetchValidationResults() {
        // Use XMLHttpRequest for validation results
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `/validation/${currentTaskId}`, true);
            xhr.setRequestHeader('X-API-Key', apiKey);
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        resolve(result);
                    } catch (e) {
                        reject(new Error(`Invalid JSON response: ${xhr.responseText}`));
                    }
                } else {
                    reject(new Error(`Failed to fetch validation results: ${xhr.responseText}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error("Network error occurred"));
            };
            
            xhr.send();
        });
    }

    async function fetchAnomalies() {
        // Use XMLHttpRequest for anomalies
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `/anomalies/${currentTaskId}`, true);
            xhr.setRequestHeader('X-API-Key', apiKey);
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        resolve(result);
                    } catch (e) {
                        reject(new Error(`Invalid JSON response: ${xhr.responseText}`));
                    }
                } else {
                    reject(new Error(`Failed to fetch anomalies: ${xhr.responseText}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error("Network error occurred"));
            };
            
            xhr.send();
        });
    }

    function displayValidationResults(results) {
        let validationHtml = '<h3>Validation Results:</h3>';
        
        if (Object.keys(results).length === 0) {
            validationHtml += '<p>No validation issues found.</p>';
        } else {
            validationHtml += '<ul>';
            for (const [invoiceNumber, warnings] of Object.entries(results)) {
                if (warnings && warnings.length > 0) {
                    validationHtml += `<li>Invoice ${invoiceNumber}:<ul>`;
                    for (const warning of warnings) {
                        validationHtml += `<li>${warning}</li>`;
                    }
                    validationHtml += '</ul></li>';
                }
            }
            validationHtml += '</ul>';
        }
        
        resultContent.innerHTML += validationHtml;
    }

    function displayAnomalies(anomalies) {
        let anomaliesHtml = '<h3>Detected Anomalies:</h3>';
        
        if (!anomalies || anomalies.length === 0) {
            anomaliesHtml += '<p>No anomalies detected.</p>';
        } else {
            anomaliesHtml += '<ul>';
            for (const anomaly of anomalies) {
                anomaliesHtml += `<li>Invoice ${anomaly.invoice_number}: `;
                if (anomaly.flags && anomaly.flags.length > 0) {
                    anomaliesHtml += `<ul>`;
                    for (const flag of anomaly.flags) {
                        anomaliesHtml += `<li>${flag}</li>`;
                    }
                    anomaliesHtml += `</ul>`;
                } else {
                    anomaliesHtml += 'No specific flags';
                }
                anomaliesHtml += `</li>`;
            }
            anomaliesHtml += '</ul>';
        }
        
        resultContent.innerHTML += anomaliesHtml;
    }
    
    // Add a simple health check to test connectivity
    fetch('/health')
        .then(response => response.json())
        .then(data => console.log('Health check successful:', data))
        .catch(error => console.error('Health check failed:', error));
});
