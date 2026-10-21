const crypto = require("crypto");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function csrfProtection(req, res, next) {
    if (!req.session) {
        return res.status(500).send("CSRF koruması için oturum gerekli.");
    }

    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    }

    res.locals.csrfToken = req.session.csrfToken;

    if (SAFE_METHODS.has(req.method)) {
        return next();
    }

    const submittedToken =
        req.get("x-csrf-token") ||
        (req.body && typeof req.body._csrf === "string" ? req.body._csrf : "");

    const expected = req.session.csrfToken;

    if (
        typeof submittedToken !== "string" ||
        submittedToken.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(submittedToken), Buffer.from(expected))
    ) {
        return res.status(403).json({
            success: false,
            message: "Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin."
        });
    }

    return next();
}

module.exports = csrfProtection;
