const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config();

const app = express();

const Appointment = require("./models/Appointment");
const appointmentRoutes = require("./routes/appointments");
const session = require("express-session");
const Service = require("./models/Service");
const serviceRoutes = require("./routes/services");
const Gallery = require("./models/Gallery");
const galleryRoutes = require("./routes/gallery");
const GallerySetting = require("./models/GallerySetting");
const settingsRoutes = require("./routes/settings");
const BusinessSetting = require("./models/BusinessSetting");
const AboutSetting = require("./models/AboutSetting");
const aboutRoutes = require("./routes/about");
const adminRoutes = require("./routes/admin");
const Slider = require("./models/Slider");
const sliderRoutes = require("./routes/slider");
const notificationRoutes = require("./routes/notifications");
const Visit = require("./models/Visit");
const BeforeAfter = require("./models/BeforeAfter");
const beforeAfterRoutes = require("./routes/beforeAfter");

// --------------------------------------------------
// VIEW ENGINE
// --------------------------------------------------

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "detail-garage-secret",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 8
        }
    })
);

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

// --------------------------------------------------
// ROUTES
// --------------------------------------------------

app.use(
    "/appointments",
    appointmentRoutes
);

app.use(
    "/services",
    serviceRoutes
);

app.use(
    "/gallery",
    galleryRoutes
);

app.use(
    "/settings",
    settingsRoutes
);

app.use(
    "/about",
    aboutRoutes
);

app.use(
    "/admin",
    adminRoutes
);

app.use(
    "/slider",
    sliderRoutes
);

app.use(
    "/notifications",
    notificationRoutes
);

app.use(
    "/before-after",
    beforeAfterRoutes
);

// --------------------------------------------------
// ANA SAYFA
// --------------------------------------------------
app.get("/", async (req, res) => {
    try {

        // BUGÜNKÜ ZİYARETİ SAY
        const today = new Date().toLocaleDateString(
            "sv-SE",
            {
                timeZone: "Europe/Istanbul"
            }
        );

        if (req.session.lastVisitDate !== today) {

            await Visit.findOneAndUpdate(
                {
                    date: today
                },
                {
                    $inc: {
                        count: 1
                    }
                },
                {
                    upsert: true,
                    returnDocument: "after",
                    setDefaultsOnInsert: true
                }
            );

            req.session.lastVisitDate = today;
        }


        // HİZMETLER
        const services = await Service
            .find({
                status: "active"
            })
            .sort({
                createdAt: 1
            });


        // GALERİ
        const galleries = await Gallery
            .find()
            .sort({
                createdAt: 1
            });


        // SLIDERLAR
        const sliders = await Slider
            .find()
            .sort({
                sortOrder: 1,
                createdAt: 1
            });


        // GALERİ AYARLARI
        let gallerySettings =
            await GallerySetting.findOne();

        if (!gallerySettings) {
            gallerySettings =
                await GallerySetting.create({});
        }


        // İŞLETME AYARLARI
        let businessSettings =
            await BusinessSetting.findOne();

        if (!businessSettings) {
            businessSettings =
                await BusinessSetting.create({});
        }


        // HAKKIMIZDA AYARLARI
        let aboutSettings =
            await AboutSetting.findOne();

        if (!aboutSettings) {
            aboutSettings =
                await AboutSetting.create({});
        }


        // BEFORE / AFTER
        let beforeAfter =
            await BeforeAfter.findOne({
                key: "main"
            });

        if (!beforeAfter) {
            beforeAfter =
                await BeforeAfter.create({
                    key: "main"
                });
        }


        // SAYFAYI GÖNDER
        res.render("index", {
            services,
            galleries,
            gallerySettings,
            businessSettings,
            aboutSettings,
            sliders,
            beforeAfter
        });


    } catch (error) {

        console.error(error);

        res.status(500).send(
            "Ana sayfa verileri alınırken bir hata oluştu."
        );

    }
});

// --------------------------------------------------
// ADMIN SAYFASI
// --------------------------------------------------
app.get("/admin", async (req, res) => {

    if (!req.session.adminId) {
        return res.redirect("/login");
    }

    try {

        // RANDEVULAR
        const appointments = await Appointment
            .find()
            .sort({
                createdAt: -1
            });


        // BUGÜNKÜ ZİYARET SAYISI
        const today = new Date().toLocaleDateString(
            "sv-SE",
            {
                timeZone: "Europe/Istanbul"
            }
        );

        const todayVisit = await Visit.findOne({
            date: today
        });

        const todayVisitors = todayVisit
            ? todayVisit.count
            : 0;


        // HİZMETLER
        const services = await Service
            .find()
            .sort({
                createdAt: 1
            });


        // GALERİ
        const galleries = await Gallery
            .find()
            .sort({
                createdAt: 1
            });


        // SLIDERLAR
        const sliders = await Slider
            .find()
            .sort({
                sortOrder: 1,
                createdAt: 1
            });


        // GALERİ AYARLARI
        let gallerySettings =
            await GallerySetting.findOne();

        if (!gallerySettings) {
            gallerySettings =
                await GallerySetting.create({});
        }


        // İŞLETME AYARLARI
        let businessSettings =
            await BusinessSetting.findOne();

        if (!businessSettings) {
            businessSettings =
                await BusinessSetting.create({});
        }


        // HAKKIMIZDA AYARLARI
        let aboutSettings =
            await AboutSetting.findOne();

        if (!aboutSettings) {
            aboutSettings =
                await AboutSetting.create({});
        }


        // ADMIN SAYFASINI GÖNDER
        res.render("admin", {
            appointments,
            services,
            galleries,
            gallerySettings,
            businessSettings,
            aboutSettings,
            sliders,
            todayVisitors
        });


    } catch (error) {

        console.error(error);

        res.status(500).send(
            "Admin verileri alınırken bir hata oluştu."
        );

    }
});


// --------------------------------------------------
// LOGIN
// --------------------------------------------------

app.get("/login", (req, res) => {
    res.render("login");
});

// --------------------------------------------------
// SERVER
// --------------------------------------------------

const PORT =
    process.env.PORT || 3000;

mongoose
    .connect(process.env.MONGO_URI)

    .then(() => {

        console.log(
            "MongoDB bağlantısı başarılı"
        );

        app.listen(PORT, () => {

            console.log(
                `Server çalışıyor: http://localhost:${PORT}`
            );

        });

    })

    .catch((error) => {

        console.error(
            "MongoDB bağlantı hatası:",
            error.message
        );

    });