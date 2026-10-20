const adminAuth = (req, res, next) => {

    if (!req.session.adminId) {

        return res.status(401).json({
            success: false,
            message: "Bu işlem için yönetici girişi gereklidir."
        });

    }

    next();
};

module.exports = adminAuth;