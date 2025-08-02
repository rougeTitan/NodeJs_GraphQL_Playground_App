// Import Node.js core modules for file system operations
const path = require('path');
const fs = require('fs');

/**
 * Utility function to delete image files from the filesystem
 * Used when posts are deleted or images are updated
 * 
 * @param {string} filePath - Relative path to the file to be deleted
 */
const clearImage = filePath => {
  // Construct absolute path by joining current directory with the relative file path
  // __dirname is the directory of the current module (util folder)
  // '..' goes up one level to the project root
  filePath = path.join(__dirname, '..', filePath);
  
  // Delete the file asynchronously
  // fs.unlink removes the file from the filesystem
  // Error callback logs any errors but doesn't throw (graceful degradation)
  fs.unlink(filePath, err => console.log(err));
};

// Export the clearImage function for use in other modules
exports.clearImage = clearImage;