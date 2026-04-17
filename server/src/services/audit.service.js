const { AuditLog } = require("../models");

class AuditService {
    static async record({ action, status, userId = null, email = null, metadata = {}, req, transaction = null }) {
        try {

            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent']

            await AuditLog.create({
                action,
                status,
                userId,
                email,
                ipAddress,
                userAgent,
                reason: metadata.reason || null,
                payload: metadata.payload || null,
            }, { transaction });
        }
        catch (error) {
            console.error('[AuditService] Failed to record audit log:', error.message);
        }       
    }
}

module.exports = AuditService;