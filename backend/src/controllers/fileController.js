const path = require('path');
const fs = require('fs');
const multer = require('multer');
const prisma = require('../config/prisma');
const { logAudit } = require('../utils/auditLogger');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `pms-${uniqueSuffix}${ext}`);
  }
});

const ALLOWED_EXTENSIONS = [
  '.doc', '.docx', '.pdf', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.rtf', '.csv', '.zip', '.rar', '.7z',
  '.png', '.jpg', '.jpeg', '.gif', '.svg',
  '.mp3', '.wav', '.mp4', '.avi', '.mkv', '.sdlxliff', '.ttx', '.po'
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} is not allowed. Executable or dangerous formats are strictly prohibited.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const uploadProjectFile = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { version = 'v1', description } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { vendors: true }
    });

    if (!project) {
      // Clean up uploaded file if project invalid
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Role check for vendor
    if (req.user.role === 'VENDOR') {
      const isAssigned = project.vendors.some(v => v.vendorId === req.user.vendorId);
      if (!isAssigned) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ success: false, message: 'Unauthorized file upload.' });
      }
    }

    const ext = path.extname(req.file.originalname).toUpperCase().replace('.', '');

    const fileRecord = await prisma.projectFile.create({
      data: {
        projectId,
        fileName: req.file.originalname,
        fileType: ext || 'UNKNOWN',
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        storagePath: req.file.filename,
        uploadedById: req.user.id,
        version: version || 'v1',
        description,
        status: 'ACTIVE'
      },
      include: {
        uploadedBy: { select: { id: true, name: true, role: true } }
      }
    });

    await logAudit({
      req,
      action: 'FILE_UPLOAD',
      entity: 'FILE',
      entityId: fileRecord.id,
      afterValue: { fileName: fileRecord.fileName, version: fileRecord.version }
    });

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      file: fileRecord
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

const getProjectFiles = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const files = await prisma.projectFile.findMany({
      where: { projectId },
      include: {
        uploadedBy: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      files
    });
  } catch (error) {
    next(error);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const fileRecord = await prisma.projectFile.findUnique({
      where: { id: fileId },
      include: {
        project: {
          include: { vendors: true }
        }
      }
    });

    if (!fileRecord) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    // Role check for vendor
    if (req.user.role === 'VENDOR') {
      const isAssigned = fileRecord.project.vendors.some(v => v.vendorId === req.user.vendorId);
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'Unauthorized file access.' });
      }
    }

    const filePath = path.join(UPLOAD_DIR, fileRecord.storagePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File asset missing from disk storage.' });
    }

    await logAudit({
      req,
      action: 'DOWNLOAD',
      entity: 'FILE',
      entityId: fileId,
      afterValue: { fileName: fileRecord.fileName }
    });

    res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.fileName}"`);
    if (fileRecord.mimeType) res.setHeader('Content-Type', fileRecord.mimeType);

    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const fileRecord = await prisma.projectFile.findUnique({ where: { id: fileId } });
    if (!fileRecord) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const filePath = path.join(UPLOAD_DIR, fileRecord.storagePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.projectFile.delete({ where: { id: fileId } });

    await logAudit({
      req,
      action: 'DELETE',
      entity: 'FILE',
      entityId: fileId,
      beforeValue: fileRecord
    });

    return res.json({
      success: true,
      message: 'File deleted.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  uploadProjectFile,
  getProjectFiles,
  downloadFile,
  deleteFile
};
