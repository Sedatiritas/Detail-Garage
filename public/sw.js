self.addEventListener("push", event => {
    let data = {
        title: "Detail Garage",
        body: "Yeni bir bildirim var.",
        url: "/admin#appointments"
    };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            console.error(
                "Push verisi okunamadı:",
                error
            );
        }
    }

    event.waitUntil(
        self.registration.showNotification(
            data.title || "Detail Garage",
            {
                body:
                    data.body ||
                    "Yeni bir bildirim var.",

                icon: "/logo.png",

                badge: "/logo.png",

                tag:
                    data.tag ||
                    `detail-garage-${Date.now()}`,

                data: {
                    url:
                        data.url ||
                        "/admin#appointments"
                },

                requireInteraction: true,

                silent: false
            }
        )
    );
});


self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        const targetUrl =
            event.notification.data?.url ||
            "/admin#appointments";

        event.waitUntil(
            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            }).then(clientList => {

                for (const client of clientList) {

                    if (
                        client.url.includes(
                            "/admin"
                        ) &&
                        "focus" in client
                    ) {
                        return client.focus();
                    }
                }

                if (clients.openWindow) {
                    return clients.openWindow(
                        targetUrl
                    );
                }

            })
        );
    }
);