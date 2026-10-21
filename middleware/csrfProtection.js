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

    // Public appointment form: retain its original submission flow.
    // Other state-changing routes remain protected by CSRF validation.
    if (req.method === "POST" && req.path === "/appointments") {
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
        // Native appointment form submissions should return to the form instead of
        // displaying a raw JSON error page. API/AJAX requests keep the JSON response.
        const acceptsHtml = req.method === "POST" &&
            req.is("application/x-www-form-urlencoded") &&
            req.get("accept")?.includes("text/html");

        if (acceptsHtml) {
            return res.redirect("/?error=csrf#appointment");
        }

        return res.status(403).json({
            success: false,
            message: "Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin."
        });
    }

    return next();
}

module.exports = csrfProtection;
