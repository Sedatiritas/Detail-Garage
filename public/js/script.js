// Public gallery image lightbox
window.openImage = function (src) {
  const modalElement = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");

  if (!modalElement || !modalImage || !src || !window.bootstrap?.Modal) {
    return;
  }

  modalImage.src = src;
  window.bootstrap.Modal.getOrCreateInstance(modalElement).show();
};

// Attach the session CSRF token to all state-changing fetch requests.
(() => {
  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  if (!csrfMeta) return;

  const csrfToken = csrfMeta.content;
  const originalFetch = window.fetch.bind(window);
  const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

  window.fetch = (resource, options = {}) => {
    const method = String(
      options.method || (resource instanceof Request ? resource.method : "GET")
    ).toUpperCase();

    if (!unsafeMethods.has(method)) {
      return originalFetch(resource, options);
    }

    const headers = new Headers(
      options.headers || (resource instanceof Request ? resource.headers : undefined)
    );
    headers.set("X-CSRF-Token", csrfToken);

    return originalFetch(resource, { ...options, method, headers });
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('admin-page')) return;  const navbar = document.getElementById('mainNavbar');
  const navLinks = document.querySelectorAll('.navbar .nav-link');
  const navbarCollapse = document.getElementById('navbarNav');
  const dateInput = document.getElementById('date');
  const scrollProgress = document.getElementById('scrollProgress');
  const heroCarouselElement = document.getElementById('heroCarousel');
  const heroCarouselInner = document.getElementById('heroCarouselInner');

  // Navbar + scroll progress
  const updateScrollUI = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    scrollProgress.style.width = `${progress}%`;
  };

  updateScrollUI();
  window.addEventListener('scroll', updateScrollUI, { passive: true });

  // Mobil menü: linke tıklayınca kapanır
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 992) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
    });
  });

  // Aktif menüyü kaydırma konumuna göre güncelle; sayfa sonundayken İletişim aktif olur.
  const sections = [...new Set(document.querySelectorAll('main section, #home, #beforeAfter, #contact'))]
    .filter(section => section.id);

  const updateActiveNavLink = () => {
    const atPageBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;
    let activeId = atPageBottom ? 'contact' : 'home';
    if (!atPageBottom) {
      const marker = window.innerHeight * 0.38;
      sections.forEach(section => {
        if (section.getBoundingClientRect().top <= marker) {
          activeId = section.id === 'beforeAfter' ? 'gallery' : section.id;
        }
      });
    }
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
    });
  };

  updateActiveNavLink();
  window.addEventListener('scroll', updateActiveNavLink, { passive: true });
  window.addEventListener('resize', updateActiveNavLink);

  // Scroll reveal: ekrana giren elementleri göster
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -30px 0px' });

  revealElements.forEach(element => revealObserver.observe(element));

  // Bugünden önce tarih seçilmesin
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }

// DOLU SAATLERİ GİZLE
const timeInput = document.getElementById("time");

if (dateInput && timeInput) {

    const allTimes = [...timeInput.options]
        .map(option => option.value)
        .filter(Boolean);

    dateInput.addEventListener("change", async () => {

        if (!dateInput.value) return;

        try {

            const response = await fetch(
                `/appointments/availability?date=${dateInput.value}`
            );

            const data = await response.json();

            if (!data.success) return;

            const bookedTimes = data.bookedTimes || [];

            timeInput.innerHTML =
                '<option value="">Saat seçin</option>';

            allTimes
                .filter(time => !bookedTimes.includes(time))
                .forEach(time => {
                    timeInput.insertAdjacentHTML(
                        "beforeend",
                        `<option value="${time}">${time}</option>`
                    );
                });

            if (timeInput.options.length === 1) {

                timeInput.innerHTML =
                    '<option value="">Bu gün için uygun saat yok</option>';

            }

        } catch (error) {

            console.error(
                "Müsait saatler alınamadı:",
                error
            );

        }

    });

}

  // Bootstrap carousel instance
  const heroCarousel = bootstrap.Carousel.getOrCreateInstance(heroCarouselElement, {
    interval: 5500,
    touch: true,
    pause: false
  });

  // Mouse / touch drag ile slider değiştirme
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerDown = false;
  let horizontalDrag = false;
  let dragMoved = false;

  heroCarouselInner.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    pointerDown = true;
    horizontalDrag = false;
    dragMoved = false;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    heroCarouselInner.classList.add('dragging');
    heroCarousel.pause();
  });

  heroCarouselInner.addEventListener('pointermove', event => {
    if (!pointerDown) return;

    const deltaX = event.clientX - pointerStartX;
    const deltaY = event.clientY - pointerStartY;

    if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
      horizontalDrag = true;
      dragMoved = true;
      event.preventDefault();
    }
  });

  const finishPointer = event => {
    if (!pointerDown) return;

    const deltaX = event.clientX - pointerStartX;
    pointerDown = false;
    heroCarouselInner.classList.remove('dragging');

    if (horizontalDrag && Math.abs(deltaX) > 55) {
      if (deltaX < 0) {
        heroCarousel.next();
      } else {
        heroCarousel.prev();
      }
    }

    heroCarousel.cycle();
  };

  heroCarouselInner.addEventListener('pointerup', finishPointer);
  heroCarouselInner.addEventListener('pointercancel', finishPointer);

  // Drag sırasında yanlışlıkla buton/link açılmasını engelle
  heroCarouselInner.addEventListener('click', event => {
    if (!dragMoved) return;
    event.preventDefault();
    event.stopPropagation();
    dragMoved = false;
  }, true);

});


/* =========================================================
   ADMIN PANEL JAVASCRIPT
   ========================================================= */
(function () {
  if (!document.body.classList.contains('admin-page')) return;

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
const sidebarOpen = document.getElementById("sidebarOpen");
const sidebarClose = document.getElementById("sidebarClose");
const pageTitle = document.getElementById("pageTitle");
const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
const sections = document.querySelectorAll(".panel-section");

const titles = {
    dashboard: "Dashboard",
    slider: "Ana Sayfa Slider",
    about: "Hakkımızda",
    appointments: "Randevular",
    services: "Hizmetler",
    gallery: "Galeri",
    settings: "İşletme Ayarları"
};

const statusMap = {
    confirmed: {
        text: "Onaylandı",
        className: "badge-success"
    },

    rejected: {
        text: "Reddedildi",
        className: "badge-danger"
    },

    completed: {
        text: "Tamamlandı",
        className: "badge-success"
    }
};

/* Randevu filtreleme */

const appointmentSearch = document.getElementById("appointmentSearch");
const appointmentStatusFilter = document.getElementById("appointmentStatusFilter");
const appointmentDateFilter = document.getElementById("appointmentDateFilter");
const appointmentFilterReset = document.getElementById("appointmentFilterReset");

function applyAppointmentFilters() {

    const searchValue = appointmentSearch?.value
        .toLocaleLowerCase("tr-TR")
        .trim() || "";

    const statusValue = appointmentStatusFilter?.value || "";
    const dateValue = appointmentDateFilter?.value || "";

    const appointmentRows = document.querySelectorAll(
        "tr[data-appointment-id]"
    );

    let visibleCount = 0;

    appointmentRows.forEach(row => {

        const rowText = row.textContent
            .toLocaleLowerCase("tr-TR");

        const rowStatus = row.dataset.status || "";
        const rowDate = row.dataset.date || "";

        const matchesSearch =
            !searchValue ||
            rowText.includes(searchValue);

        const matchesStatus =
            !statusValue ||
            rowStatus === statusValue;

        const matchesDate =
            !dateValue ||
            rowDate === dateValue;

        const isVisible =
            matchesSearch &&
            matchesStatus &&
            matchesDate;

        row.style.display = isVisible ? "" : "none";

        if (isVisible) {
            visibleCount++;
        }
    });

    // Filtre sonucunda hiç randevu yoksa mesaj göster
    let noResultsRow = document.getElementById(
        "appointmentNoResults"
    );

    const tbody = document.querySelector(
        "tr[data-appointment-id]"
    )?.closest("tbody");

    if (!tbody) return;

    if (visibleCount === 0 && appointmentRows.length > 0) {

        if (!noResultsRow) {

            noResultsRow = document.createElement("tr");
            noResultsRow.id = "appointmentNoResults";

            noResultsRow.innerHTML = `
                <td colspan="100%" class="text-center py-5 text-secondary">
                    <i class="bi bi-search fs-3 d-block mb-2"></i>
                    Filtrelere uygun randevu bulunamadı.
                </td>
            `;

            tbody.appendChild(noResultsRow);
        }

        noResultsRow.style.display = "";

    } else if (noResultsRow) {

        noResultsRow.style.display = "none";
    }
}

// Randevu silme gibi dosyanın diğer bölümlerinden de filtreleri çağırabilmek için dışa aç.
window.applyAppointmentFilters = applyAppointmentFilters;


// Arama
appointmentSearch?.addEventListener(
    "input",
    applyAppointmentFilters
);


// Durum
appointmentStatusFilter?.addEventListener(
    "change",
    applyAppointmentFilters
);


// Tarih
appointmentDateFilter?.addEventListener(
    "change",
    applyAppointmentFilters
);


// Temizle
appointmentFilterReset?.addEventListener(
    "click",
    () => {

        if (appointmentSearch) {
            appointmentSearch.value = "";
        }

        if (appointmentStatusFilter) {
            appointmentStatusFilter.value = "";
        }

        if (appointmentDateFilter) {
            appointmentDateFilter.value = "";
        }

        applyAppointmentFilters();
    }
);


function openSidebar() {
  sidebar.classList.add("show");
  overlay.classList.add("show");
}

function closeSidebar() {
  sidebar.classList.remove("show");
  overlay.classList.remove("show");
}

sidebarOpen?.addEventListener("click", openSidebar);
sidebarClose?.addEventListener("click", closeSidebar);
overlay?.addEventListener("click", closeSidebar);

function showSection(id, updateHash = true) {
  const target = document.getElementById(id) || document.getElementById("dashboard");
  const targetId = target.id;

  sections.forEach(section => section.classList.remove("active-section"));
  target.classList.add("active-section");

  navItems.forEach(item => {
    item.classList.toggle("active", item.getAttribute("href") === `#${targetId}`);
  });

  pageTitle.textContent = titles[targetId] || "Dashboard";

  if (updateHash) {
    history.replaceState(null, "", `#${targetId}`);
  }

  closeSidebar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navItems.forEach(item => {
  item.addEventListener("click", event => {
    event.preventDefault();
    const id = item.getAttribute("href").replace("#", "");
    showSection(id);
  });
});

window.addEventListener("hashchange", () => {
  showSection(location.hash.replace("#", "") || "dashboard", false);
});

document.querySelectorAll(".panel-link").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    showSection(link.getAttribute("href").replace("#", ""));
  });
});

/* ADMIN YENİ RANDEVU - DOLU SAATLER */

const adminAppointmentForm =
    document.getElementById("appointmentForm");

if (adminAppointmentForm) {

    const adminDateInput =
        adminAppointmentForm.querySelector('[name="date"]');

    const adminTimeInput =
        adminAppointmentForm.querySelector('[name="time"]');

    if (adminDateInput && adminTimeInput) {

        const allAdminTimes = [
            ...adminTimeInput.options
        ]
            .map(option => option.value)
            .filter(Boolean);

        adminDateInput.addEventListener(
            "change",
            async () => {

                if (!adminDateInput.value) {
                    return;
                }

                try {

                    const response =
                        await fetch(
                            `/appointments/availability?date=${adminDateInput.value}`
                        );

                    const data =
                        await response.json();

                    if (!data.success) {
                        return;
                    }

                    const bookedTimes =
                        data.bookedTimes || [];

                    adminTimeInput.innerHTML =
                        '<option value="">Saat seçin</option>';

                    allAdminTimes
                        .filter(
                            time =>
                                !bookedTimes.includes(time)
                        )
                        .forEach(time => {

                            adminTimeInput.insertAdjacentHTML(
                                "beforeend",
                                `<option value="${time}">${time}</option>`
                            );

                        });

                    if (
                        adminTimeInput.options.length === 1
                    ) {

                        adminTimeInput.innerHTML =
                            '<option value="">Bu gün için uygun saat yok</option>';

                    }

                } catch (error) {

                    console.error(
                        "Admin müsait saatler alınamadı:",
                        error
                    );
                }

            }
        );
    }
}

/* Randevu işlem menülerini tablo scroll alanının dışına alarak tam göster. */
(() => {
  const menuOrigins = new Map();
  document.addEventListener("shown.bs.dropdown", event => {
    const toggle = event.target.closest('[data-bs-toggle="dropdown"]');
    const dropdown = toggle?.closest(".dropdown");
    const menu = dropdown?.querySelector(".appointment-menu");
    if (!toggle || !dropdown || !menu || menuOrigins.has(dropdown)) return;
    const origin = { menu, parent: menu.parentElement, nextSibling: menu.nextSibling, toggle };
    menuOrigins.set(dropdown, origin);
    document.body.appendChild(menu);
    menu.classList.add("show");
    menu.style.setProperty("position", "fixed", "important");
    menu.style.setProperty("display", "block", "important");
    menu.style.setProperty("z-index", "2000", "important");
    menu.style.setProperty("margin", "0", "important");
    menu.style.setProperty("transform", "none", "important");
    menu.style.setProperty("inset", "auto", "important");
    const buttonRect = toggle.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const gap = 6;
    const openAbove = window.innerHeight - buttonRect.bottom < menuRect.height + gap;
    const rawTop = openAbove ? buttonRect.top - menuRect.height - gap : buttonRect.bottom + gap;
    const top = Math.max(gap, Math.min(rawTop, window.innerHeight - menuRect.height - gap));
    const left = Math.max(gap, Math.min(buttonRect.right - menuRect.width, window.innerWidth - menuRect.width - gap));
    menu.style.setProperty("top", top + "px", "important");
    menu.style.setProperty("left", left + "px", "important");
  });
  document.addEventListener("hidden.bs.dropdown", event => {
    const toggle = event.target.closest('[data-bs-toggle="dropdown"]');
    const dropdown = toggle?.closest(".dropdown");
    const origin = dropdown && menuOrigins.get(dropdown);
    if (!origin) return;
    const { menu, parent, nextSibling } = origin;
    menu.classList.remove("show");
    menu.removeAttribute("style");
    if (parent) {
      if (nextSibling && nextSibling.parentNode === parent) parent.insertBefore(menu, nextSibling);
      else parent.appendChild(menu);
    }
    menuOrigins.delete(dropdown);
  });
})();
/* Randevu durum değişiklikleri — dinamik satırlar için event delegation */

document.addEventListener("click", async event => {
    const clickedButton = event.target.closest(".appointment-action");
    if (!clickedButton) return;

    const appointmentId = clickedButton.dataset.id;
    const newStatus = clickedButton.dataset.action;
    const row = clickedButton.closest("tr");
    const badge = row?.querySelector(".badge-soft");

    if (!appointmentId || !newStatus || !row || !badge) return;

    try {
        clickedButton.disabled = true;

        const response = await fetch(`/appointments/${appointmentId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Randevu güncellenemedi.");
        }

        const statusInfo = statusMap[newStatus];
        badge.textContent = statusInfo.text;
        badge.className = `badge-soft ${statusInfo.className}`;
        row.dataset.status = newStatus;
        applyAppointmentFilters();
        showToast("Randevu durumu güncellendi.");
    } catch (error) {
        console.error(error);
        showToast(error.message || "Randevu güncellenirken hata oluştu.");
    } finally {
        clickedButton.disabled = false;
    }
});


/* Randevu tablosunu sunucudaki güncel verilerle eşitle */

const appointmentTableBody = document.querySelector("#appointments tbody");

function appointmentStatusInfo(status) {
    const map = {
        pending: { text: "Bekliyor", className: "badge-warning" },
        confirmed: { text: "Onaylandı", className: "badge-success" },
        rejected: { text: "Reddedildi", className: "badge-danger" },
        completed: { text: "Tamamlandı", className: "badge-success" }
    };
    return map[status] || map.pending;
}

function createAppointmentRow(appointment) {
    const row = document.createElement("tr");
    row.dataset.appointmentId = appointment._id;
    row.dataset.status = appointment.status || "pending";
    row.dataset.date = appointment.date || "";

    const dateLabel = appointment.date
        ? new Date(`${appointment.date}T00:00:00`).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "short"
        })
        : "—";
    const status = appointmentStatusInfo(appointment.status);

    row.innerHTML = `
        <td><strong class="appointment-customer-name"></strong><span class="sub-text appointment-customer-phone"></span></td>
        <td class="appointment-vehicle"></td>
        <td class="appointment-service"></td>
        <td><span class="appointment-date"></span> · <span class="appointment-time"></span></td>
        <td class="appointment-message"></td>
        <td><span class="badge-soft ${status.className}">${status.text}</span></td>
        <td class="text-end">
            <div class="d-inline-flex align-items-center gap-2">
                <div class="dropdown dropup">
                    <button class="table-action" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="İşlemler">
                        <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end appointment-menu shadow-sm">
                        <li><button type="button" class="dropdown-item appointment-action" data-action="confirmed"><i class="bi bi-check2-circle text-success me-2"></i>Onayla</button></li>
                        <li><button type="button" class="dropdown-item appointment-action" data-action="rejected"><i class="bi bi-x-circle text-danger me-2"></i>Reddet</button></li>
                        <li><button type="button" class="dropdown-item appointment-action" data-action="completed"><i class="bi bi-check-lg me-2"></i>Tamamlandı</button></li>
                    </ul>
                </div>
                <button type="button" class="table-action text-danger appointment-delete-btn" title="Randevuyu sil" aria-label="Randevuyu sil">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </td>
    `;

    row.querySelector(".appointment-customer-name").textContent = appointment.name || "";
    row.querySelector(".appointment-customer-phone").textContent = appointment.phone || "";
    row.querySelector(".appointment-vehicle").textContent = appointment.vehicle || "";
    row.querySelector(".appointment-service").textContent = appointment.service || "";
    row.querySelector(".appointment-date").textContent = dateLabel;
    row.querySelector(".appointment-time").textContent = appointment.time || "";
    row.querySelector(".appointment-message").textContent = appointment.message || "—";

    row.querySelectorAll(".appointment-action").forEach(button => {
        button.dataset.id = appointment._id;
    });
    row.querySelector(".appointment-delete-btn").dataset.id = appointment._id;

    return row;
}

function updateAppointmentRow(row, appointment) {
    const status = appointmentStatusInfo(appointment.status);
    const badge = row.querySelector(".badge-soft");
    if (badge) {
        badge.textContent = status.text;
        badge.className = `badge-soft ${status.className}`;
    }
    row.dataset.status = appointment.status || "pending";
    row.dataset.date = appointment.date || "";
}

async function refreshAppointmentsTable() {
    if (!appointmentTableBody) return;

    try {
        const response = await fetch("/appointments/admin/list", {
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });
        if (!response.ok) return;

        const data = await response.json();
        if (!data.success || !Array.isArray(data.appointments)) return;

        const emptyRow = appointmentTableBody.querySelector("tr:not([data-appointment-id])");
        const serverIds = new Set(data.appointments.map(item => String(item._id)));

        data.appointments.forEach(appointment => {
            const id = String(appointment._id);
            let row = appointmentTableBody.querySelector(`tr[data-appointment-id="${id}"]`);

            if (!row) {
                row = createAppointmentRow(appointment);
                appointmentTableBody.prepend(row);
            } else {
                updateAppointmentRow(row, appointment);
            }
        });

        appointmentTableBody.querySelectorAll("tr[data-appointment-id]").forEach(row => {
            if (!serverIds.has(String(row.dataset.appointmentId))) row.remove();
        });

        if (emptyRow && appointmentTableBody.querySelector("tr[data-appointment-id]")) {
            emptyRow.remove();
        } else if (!appointmentTableBody.querySelector("tr[data-appointment-id]")) {
            appointmentTableBody.innerHTML = `
                <tr><td colspan="7" class="text-center py-5 text-secondary">
                    <i class="bi bi-calendar-x d-block fs-3 mb-2"></i>
                    Henüz randevu bulunmuyor.
                </td></tr>
            `;
        }

        applyAppointmentFilters();
    } catch (error) {
        console.error("Randevu listesi yenilenemedi:", error);
    }
}


/* Telefon alanı: yalnızca rakam ve en fazla 11 hane */
(() => {
    const phoneInput = document.getElementById("phone");
    if (!phoneInput) return;

    phoneInput.addEventListener("input", () => {
        const digitsOnly = phoneInput.value.replace(/\\D/g, "").slice(0, 11);
        if (phoneInput.value !== digitsOnly) {
            phoneInput.value = digitsOnly;
        }
    });

    phoneInput.addEventListener("paste", event => {
        event.preventDefault();
        const pastedText = event.clipboardData?.getData("text") || "";
        phoneInput.value = pastedText.replace(/\\D/g, "").slice(0, 11);
        phoneInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
})();


/* Yeni randevu formu */

document.getElementById("appointmentForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        const formData = new FormData(form);
        const response = await fetch("/appointments/admin", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(formData)
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Randevu oluşturulamadı.");
        }

        bootstrap.Modal.getInstance(document.getElementById("appointmentModal"))?.hide();
        form.reset();
        await refreshAppointmentsTable();
        showToast("Yeni randevu başarıyla oluşturuldu.");
    } catch (error) {
        console.error(error);
        showToast(error.message || "Randevu oluşturulurken hata oluştu.");
    } finally {
        submitButton.disabled = false;
    }
});


/* Admin paneli açıkken yeni randevuları düzenli kontrol et */
if (appointmentTableBody) {
    // Panel açılır açılmaz güncel listeyi al.
    refreshAppointmentsTable();

    // Admin paneli açıkken randevuları 10 saniyede bir kontrol et.
    window.setInterval(() => {
        if (!document.hidden) {
            refreshAppointmentsTable();
        }
    }, 10000);

    // Kullanıcı sekmeye geri döndüğünde listeyi hemen güncelle.
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            refreshAppointmentsTable();
        }
    });

    window.addEventListener("focus", refreshAppointmentsTable);
}


/* Hizmet modalı */

const serviceModal = document.getElementById("serviceModal");
const serviceForm = document.getElementById("serviceForm");
const serviceDeleteBtn = document.getElementById("serviceDeleteBtn");
const serviceGrid = document.querySelector("#services .section-toolbar + .row.g-4");


/* HİZMET KARTI OLUŞTUR */
function createServiceCard(service, index) {
    const column = document.createElement("div");
    column.className = "col-md-6 col-xl-3";

    const card = document.createElement("div");
    card.className = "service-admin-card";
    card.dataset.serviceId = service._id;

    card.innerHTML = `
        <div class="service-admin-top">
            <div class="service-admin-icon">
                <i class="bi bi-stars"></i>
            </div>
            <span class="status-pill"></span>
        </div>
        <span class="service-no"></span>
        <h3></h3>
        <p></p>
        <div class="service-admin-bottom">
            <strong></strong>
            <button class="table-action edit-service-btn" type="button"
                data-bs-toggle="modal" data-bs-target="#serviceModal" data-mode="edit">
                <i class="bi bi-pencil"></i>
            </button>
        </div>
    `;

    card.querySelector(".status-pill").textContent =
        service.status === "active" ? "Yayında" : "Pasif";
    card.querySelector(".status-pill").classList.toggle(
        "active",
        service.status === "active"
    );
    card.querySelector(".service-no").textContent =
        String(index + 1).padStart(2, "0");
    card.querySelector("h3").textContent = service.name || "";
    card.querySelector("p").textContent = service.description || "";
    card.querySelector(".service-admin-bottom strong").textContent =
        `₺${Number(service.price || 0).toLocaleString("tr-TR")}`;

    const editButton = card.querySelector(".edit-service-btn");
    editButton.dataset.id = service._id;

    column.appendChild(card);
    return column;
}


/* HİZMET NUMARALARINI YENİLE */
function refreshServiceNumbers() {
    if (!serviceGrid) return;

    serviceGrid.querySelectorAll(".service-admin-card").forEach((card, index) => {
        const number = card.querySelector(".service-no");
        if (number) number.textContent = String(index + 1).padStart(2, "0");
    });
}


/* BOŞ HİZMET DURUMU */
function showEmptyServicesState() {
    if (!serviceGrid || serviceGrid.querySelector(".service-admin-card")) return;

    const emptyColumn = document.createElement("div");
    emptyColumn.className = "col-12";
    emptyColumn.innerHTML = `
        <div class="panel-card text-center py-5">
            <i class="bi bi-stars fs-1 text-secondary d-block mb-3"></i>
            <h3 class="h5">Henüz hizmet eklenmemiş</h3>
            <p class="text-secondary mb-0">
                İlk hizmetinizi eklemek için "Hizmet Ekle" butonunu kullanın.
            </p>
        </div>
    `;
    serviceGrid.appendChild(emptyColumn);
}


/* MODAL AÇILINCA */
serviceModal?.addEventListener("show.bs.modal", event => {
    const trigger = event.relatedTarget;
    const mode = trigger?.dataset.mode || "add";
    const serviceId = trigger?.dataset.id || "";
    const title = document.getElementById("serviceModalTitle");

    serviceForm.dataset.mode = mode;
    serviceForm.dataset.id = serviceId;

    serviceDeleteBtn?.classList.toggle("d-none", mode !== "edit");

    if (mode === "edit") {
        title.textContent = "Hizmeti Düzenle";

        const card = trigger?.closest(".service-admin-card");
        document.getElementById("serviceName").value =
            card?.querySelector("h3")?.textContent.trim() || "";
        document.getElementById("serviceDescription").value =
            card?.querySelector("p")?.textContent.trim() || "";
        document.getElementById("servicePrice").value =
            (card?.querySelector(".service-admin-bottom strong")?.textContent || "")
                .replace("₺", "").replace(/\./g, "").trim();

        document.getElementById("serviceStatus").value =
            card?.querySelector(".status-pill")?.textContent.trim() === "Pasif"
                ? "inactive"
                : "active";
    } else {
        title.textContent = "Hizmet Ekle";
        serviceForm.reset();
        serviceForm.dataset.mode = "add";
        serviceForm.dataset.id = "";
    }
});


/* HİZMET EKLE / DÜZENLE */
serviceForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const mode = serviceForm.dataset.mode || "add";
    const serviceId = serviceForm.dataset.id;
    const name = document.getElementById("serviceName").value.trim();
    const description = document.getElementById("serviceDescription").value.trim();
    const price = Number(document.getElementById("servicePrice").value);
    const status = document.getElementById("serviceStatus").value;

    if (!name || !description || !price) {
        showToast("Lütfen tüm alanları doldurun.");
        return;
    }

    const submitButton = serviceForm.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;

        const response = await fetch(
            mode === "edit" ? `/services/${serviceId}` : "/services",
            {
                method: mode === "edit" ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    price,
                    status,
                    icon: "bi-stars"
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "İşlem gerçekleştirilemedi.");
        }

        if (!serviceGrid || !data.service) {
            throw new Error("Hizmet kaydedildi ancak liste güncellenemedi. Lütfen sayfayı yenileyin.");
        }

        const existingCard = serviceGrid.querySelector(
            `.service-admin-card[data-service-id="${serviceId}"]`
        );

        if (mode === "edit" && existingCard) {
            const updatedColumn = createServiceCard(data.service, 0);
            existingCard.closest(".col-md-6")?.replaceWith(updatedColumn);
            // Kolonun sınıfını mevcut tasarımla aynı tut.
            updatedColumn.className = "col-md-6 col-xl-3";
        } else {
            serviceGrid.querySelector(".col-12")?.remove();
            serviceGrid.appendChild(
                createServiceCard(data.service, serviceGrid.querySelectorAll(".service-admin-card").length)
            );
        }

        refreshServiceNumbers();

        bootstrap.Modal.getInstance(serviceModal)?.hide();
        showToast(mode === "edit"
            ? "Hizmet başarıyla güncellendi."
            : "Hizmet başarıyla eklendi.");

    } catch (error) {
        console.error(error);
        showToast(error.message || "Hizmet kaydedilirken bir hata oluştu.");
    } finally {
        submitButton.disabled = false;
    }
});


/* HİZMET SİL */
serviceDeleteBtn?.addEventListener("click", async () => {
    const serviceId = serviceForm.dataset.id;
    if (!serviceId) return;

    if (!confirm("Bu hizmeti silmek istediğinize emin misiniz?")) return;

    try {
        serviceDeleteBtn.disabled = true;

        const response = await fetch(`/services/${serviceId}`, {
            method: "DELETE"
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Hizmet silinemedi.");
        }

        serviceGrid?.querySelector(
            `.service-admin-card[data-service-id="${serviceId}"]`
        )?.closest(".col-md-6")?.remove();

        refreshServiceNumbers();
        showEmptyServicesState();

        bootstrap.Modal.getInstance(serviceModal)?.hide();
        showToast("Hizmet başarıyla silindi.");

    } catch (error) {
        console.error(error);
        showToast(error.message || "Hizmet silinirken hata oluştu.");
    } finally {
        serviceDeleteBtn.disabled = false;
    }
});


/* İŞLETME AYARLARI */

document
    .getElementById("saveSettingsBtn")
    ?.addEventListener("click", async () => {

        const button =
            document.getElementById("saveSettingsBtn");

        const businessName =
            document.getElementById("businessName");

        const phone =
            document.getElementById("businessPhone");

        const email =
            document.getElementById("businessEmail");

        const location =
            document.getElementById("businessLocation");

        const footerDescription =
            document.getElementById("footerDescription");

        const copyright =
            document.getElementById("businessCopyright");

        const instagramUrl =
            document.getElementById("instagramUrl");

        const tiktokUrl =
            document.getElementById("tiktokUrl");

        const whatsappUrl =
            document.getElementById("whatsappUrl");

        const mapUrl =
            document.getElementById("businessMapUrl");
        const appointmentsOpen =
            document.getElementById("appointmentsOpen");

        if (!mapUrl) return;


        const mapValue =
            mapUrl.value.trim();


        if (!mapValue) {

            showToast(
                "Google Maps adresi boş bırakılamaz."
            );

            return;
        }


        try {

            button.disabled = true;


            const response =
                await fetch("/settings", {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        businessName:
                            businessName?.value.trim() || "",

                        phone:
                            phone?.value.trim() || "",

                        email:
                            email?.value.trim() || "",

                        location:
                            location?.value.trim() || "",

                        footerDescription:
                            footerDescription?.value.trim() || "",

                        copyright:
                            copyright?.value.trim() || "",

                        instagramUrl:
                            instagramUrl?.value.trim() || "",

                        tiktokUrl:
                            tiktokUrl?.value.trim() || "",

                        whatsappUrl:
                            whatsappUrl?.value.trim() || "",

                        mapUrl:
                            mapValue,
                        appointmentsOpen:
                            appointmentsOpen?.checked ?? true
                    })

                });


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Ayarlar kaydedilemedi."
                );

            }


            showToast(
                "İşletme ayarları başarıyla kaydedildi."
            );


        } catch (error) {

            console.error(error);

            showToast(
                error.message ||
                "Ayarlar kaydedilirken hata oluştu."
            );


        } finally {

            button.disabled = false;

        }

    });

/* İŞLETME LOGOSU */

const businessLogoFile = document.getElementById("businessLogoFile");
const businessLogoPreview = document.getElementById("businessLogoPreview");
const uploadBusinessLogoBtn = document.getElementById("uploadBusinessLogoBtn");

businessLogoFile?.addEventListener("change", () => {
    const file = businessLogoFile.files?.[0];
    if (!file || !businessLogoPreview) return;

    const previewUrl = URL.createObjectURL(file);
    businessLogoPreview.src = previewUrl;
    businessLogoPreview.onload = () => URL.revokeObjectURL(previewUrl);
});

uploadBusinessLogoBtn?.addEventListener("click", async () => {
    const file = businessLogoFile?.files?.[0];

    if (!file) {
        showToast("Önce bir logo dosyası seçin.");
        return;
    }

    const formData = new FormData();
    formData.append("logo", file);

    uploadBusinessLogoBtn.disabled = true;

    try {
        const response = await fetch("/settings/logo", {
            method: "POST",
            body: formData
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Logo yüklenemedi.");
        }

        if (businessLogoPreview) {
            businessLogoPreview.src = data.logoUrl;
        }

        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) favicon.href = data.logoUrl;

        businessLogoFile.value = "";
        showToast(data.message || "Logo başarıyla güncellendi.");
    } catch (error) {
        console.error(error);
        showToast(error.message || "Logo yüklenirken bir hata oluştu.");
    } finally {
        uploadBusinessLogoBtn.disabled = false;
    }
});

/* ÖNCESİ / SONRASI */

const beforeAfterForm = document.getElementById("beforeAfterForm");

if (beforeAfterForm) {
    const beforeInput = document.getElementById("beforeImage");
    const afterInput = document.getElementById("afterImage");
    const beforePreview = document.getElementById("beforeImagePreview");
    const afterPreview = document.getElementById("afterImagePreview");
    const status = document.getElementById("beforeAfterStatus");
    const saveButton = document.getElementById("beforeAfterSaveBtn");

    const fallbackBeforeImage = "/uploads/before-after/before-after-1790541918697-267383780.png";
    const fallbackAfterImage = "/uploads/before-after/before-after-1790541918701-776458010.png";

    const renderPreview = (container, src, alt) => {
        if (!container || !src) return;
        container.innerHTML = "";
        const image = document.createElement("img");
        image.src = src;
        image.alt = alt;
        image.className = "w-100 h-100";
        image.style.objectFit = "cover";
        image.onerror = () => {
            container.innerHTML = '<div class="h-100 d-flex align-items-center justify-content-center text-secondary small">Görsel yüklenemedi</div>';
        };
        container.appendChild(image);
    };

    const loadBeforeAfter = async () => {
        try {
            const response = await fetch("/before-after", { cache: "no-store" });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || "Mevcut görseller alınamadı.");
            }

            renderPreview(beforePreview, data.beforeAfter?.beforeImageUrl || fallbackBeforeImage, "İşlem öncesi görsel");
            renderPreview(afterPreview, data.beforeAfter?.afterImageUrl || fallbackAfterImage, "İşlem sonrası görsel");
            if (status) status.textContent = "Mevcut görseller yüklendi. Değiştirmek istediğiniz fotoğrafı seçebilirsiniz.";
        } catch (error) {
            console.error("Before/After görselleri yüklenemedi:", error);
            if (status) status.textContent = "Mevcut görseller yüklenemedi. Fotoğrafları seçip tekrar deneyin.";
        }
    };

    beforeInput?.addEventListener("change", () => {
        const file = beforeInput.files?.[0];
        if (file) renderPreview(beforePreview, URL.createObjectURL(file), "Seçilen işlem öncesi görsel");
    });

    afterInput?.addEventListener("change", () => {
        const file = afterInput.files?.[0];
        if (file) renderPreview(afterPreview, URL.createObjectURL(file), "Seçilen işlem sonrası görsel");
    });

    beforeAfterForm.addEventListener("submit", async event => {
        event.preventDefault();

        const beforeFile = beforeInput?.files?.[0];
        const afterFile = afterInput?.files?.[0];

        if (!beforeFile && !afterFile) {
            showToast("Lütfen değiştirmek istediğiniz en az bir fotoğrafı seçin.");
            return;
        }

        const formData = new FormData();
        if (beforeFile) formData.append("beforeImage", beforeFile);
        if (afterFile) formData.append("afterImage", afterFile);

        const originalButtonHtml = saveButton?.innerHTML;
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> Kaydediliyor...';
        }
        if (status) status.textContent = "Fotoğraflar yükleniyor...";

        try {
            const response = await fetch("/before-after", {
                method: "PUT",
                body: formData
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Before / After fotoğrafları kaydedilemedi.");
            }

            renderPreview(beforePreview, data.beforeAfter?.beforeImageUrl || fallbackBeforeImage, "İşlem öncesi görsel");
            renderPreview(afterPreview, data.beforeAfter?.afterImageUrl || fallbackAfterImage, "İşlem sonrası görsel");
            beforeAfterForm.reset();

            if (status) status.textContent = "Fotoğraflar başarıyla kaydedildi.";
            showToast(data.message || "Before / After fotoğrafları başarıyla kaydedildi.");
        } catch (error) {
            console.error("Before/After kaydetme hatası:", error);
            if (status) status.textContent = error.message || "Fotoğraflar kaydedilemedi.";
            showToast(error.message || "Fotoğraflar yüklenirken bir hata oluştu.");
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.innerHTML = originalButtonHtml || '<i class="bi bi-check2 me-1"></i> Before / After kaydet';
            }
        }
    });

    loadBeforeAfter();
}

/* GALERİ */

const galleryUploadForm =
    document.getElementById("galleryUploadForm");

const galleryDeleteButtons =
    document.querySelectorAll(".gallery-delete-btn");


/* GALERİ AYARLARI */

const gallerySettingsForm =
    document.getElementById("gallerySettingsForm");

gallerySettingsForm?.addEventListener("submit", async event => {

    event.preventDefault();

    const title =
        document.getElementById("galleryTitle").value.trim();

    const description =
        document.getElementById("galleryDescription").value.trim();

    if (!title || !description) {
        showToast("Başlık ve açıklama boş bırakılamaz.");
        return;
    }

    const submitButton =
        gallerySettingsForm.querySelector(
            'button[type="submit"]'
        );

    try {

        submitButton.disabled = true;

        const response = await fetch("/gallery/settings", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                description
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Galeri ayarları kaydedilemedi."
            );
        }

        showToast(
            "Galeri ayarları başarıyla kaydedildi."
        );

    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Galeri ayarları kaydedilirken hata oluştu."
        );

    } finally {

        submitButton.disabled = false;

    }

});

/* ANA SAYFA GALERİ AYARLARINI OTOMATİK GÜNCELLE */

const publicGalleryTitle =
    document.getElementById("galleryPublicTitle");

const publicGalleryDescription =
    document.getElementById("galleryPublicDescription");

if (
    publicGalleryTitle ||
    publicGalleryDescription
) {

    setInterval(async () => {

        try {

            const response =
                await fetch("/gallery/settings");

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            if (!data.success) {
                return;
            }

            if (publicGalleryTitle) {

                publicGalleryTitle.textContent =
                    data.settings.title;

            }

            if (publicGalleryDescription) {

                publicGalleryDescription.textContent =
                    data.settings.description;

            }

        } catch (error) {

            console.error(
                "Galeri ayarları alınamadı:",
                error
            );

        }

    }, 3000);

}


/* FOTOĞRAF YÜKLE */

galleryUploadForm?.addEventListener("submit", async event => {

    event.preventDefault();

    const submitButton =
        galleryUploadForm.querySelector(
            'button[type="submit"]'
        );

    const image =
        document.getElementById("galleryImage");

    const caption =
        document.getElementById("galleryCaption");


    if (!image.files.length) {
        showToast("Lütfen bir fotoğraf seçin.");
        return;
    }


    if (!caption.value.trim()) {
        showToast("Fotoğraf açıklamasını girin.");
        return;
    }


    const formData =
        new FormData(galleryUploadForm);


    try {

        submitButton.disabled = true;

        const response = await fetch("/gallery", {
            method: "POST",
            body: formData
        });


        const data =
            await response.json();


        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Fotoğraf yüklenemedi."
            );
        }


        showToast(
            "Fotoğraf başarıyla yüklendi."
        );


        setTimeout(() => {
            window.location.href =
                "/admin#gallery";
        }, 700);


    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Fotoğraf yüklenirken bir hata oluştu."
        );


    } finally {

        submitButton.disabled = false;

    }

});

/* =========================================================
   ANA SAYFA SLIDER YÖNETİMİ
   ========================================================= */

const sliderForm =
    document.getElementById("sliderForm");

const sliderImage =
    document.getElementById("sliderImage");

const sliderImagePreview =
    document.getElementById("sliderImagePreview");

const sliderEyebrow =
    document.getElementById("sliderEyebrow");

const sliderTitleBefore =
    document.getElementById("sliderTitleBefore");

const sliderTitleHighlight =
    document.getElementById("sliderTitleHighlight");

const sliderTitleAfter =
    document.getElementById("sliderTitleAfter");

const sliderDescription =
    document.getElementById("sliderDescription");

const sliderAdminGrid =
    document.getElementById("sliderAdminGrid");

const sliderEmptyState =
    document.getElementById("sliderEmptyState");

const sliderCount =
    document.getElementById("sliderCount");

const sliderFormTitle =
    document.getElementById("sliderFormTitle");

const saveSliderBtn =
    document.getElementById("saveSliderBtn");

const cancelSliderEditBtn =
    document.getElementById("cancelSliderEditBtn");


let editingSliderId = null;


// --------------------------------------------------
// GÖRSEL ÖNİZLEME
// --------------------------------------------------

sliderImage?.addEventListener("change", event => {

    const file = event.target.files[0];

    if (!file || !sliderImagePreview) {
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {

        sliderImagePreview.innerHTML = `
            <img
                src="${reader.result}"
                alt="Slider önizleme"
                class="w-100 h-100 object-fit-cover"
            >
        `;

    };

    reader.readAsDataURL(file);
});


// --------------------------------------------------
// FORMU SIFIRLA
// --------------------------------------------------

function resetSliderForm() {

    editingSliderId = null;

    sliderForm?.reset();

    if (sliderFormTitle) {
        sliderFormTitle.textContent =
            "Yeni Slider Ekle";
    }

    if (saveSliderBtn) {

        saveSliderBtn.innerHTML = `
            <i class="bi bi-plus-lg me-1"></i>
            Slider Ekle
        `;

    }

    cancelSliderEditBtn?.classList.add("d-none");

    if (sliderImage) {
        sliderImage.required = true;
    }

    if (sliderImagePreview) {

        sliderImagePreview.innerHTML = `
            <div class="text-center text-secondary">
                <i class="bi bi-image fs-1 d-block mb-2"></i>
                <span>Henüz görsel seçilmedi.</span>
            </div>
        `;

    }

}


// --------------------------------------------------
// SLIDER SAYACI
// --------------------------------------------------

function updateSliderCount(count) {

    if (!sliderCount) {
        return;
    }

    sliderCount.textContent =
        `${count} / 5 slider`;

}


// --------------------------------------------------
// SLIDER KARTLARI
// --------------------------------------------------

function renderSliderCards(sliders) {

    if (!sliderAdminGrid) {
        return;
    }

    sliderAdminGrid.innerHTML = "";

    updateSliderCount(sliders.length);

    if (!sliders.length) {

        sliderAdminGrid.innerHTML = `
            <div class="col-12" id="sliderEmptyState">
                <div class="panel-card text-center py-5">
                    <i class="bi bi-images fs-1 text-secondary d-block mb-3"></i>

                    <h3 class="h5">
                        Henüz slider eklenmemiş
                    </h3>

                    <p class="text-secondary mb-0">
                        Yukarıdaki formdan ilk sliderınızı ekleyebilirsiniz.
                    </p>
                </div>
            </div>
        `;

        return;
    }


    sliders.forEach((slider, index) => {

        const col = document.createElement("div");

        col.className = "col-xl-6";


        col.innerHTML = `
            <div class="panel-card h-100">

                <div
                    class="rounded-4 overflow-hidden mb-3 bg-light"
                    style="height: 240px;"
                >
                    <img
                        src="${slider.imageUrl}"
                        alt="${escapeHtml(slider.eyebrow)}"
                        class="w-100 h-100 object-fit-cover"
                    >
                </div>

                <div class="d-flex align-items-center justify-content-between gap-3 mb-3">

                    <div>
                        <span class="section-mini-title">
                            SLIDER ${index + 1}
                        </span>

                        <h3 class="h5 mb-0 mt-1">
                            ${escapeHtml(slider.eyebrow)}
                        </h3>
                    </div>

                    <span class="badge-soft badge-success">
                        Aktif
                    </span>

                </div>

                <h4 class="h5 fw-bold mb-2">
                    ${escapeHtml(slider.titleBefore)}
                    <span class="text-accent">
                        ${escapeHtml(slider.titleHighlight)}
                    </span>
                    ${escapeHtml(slider.titleAfter)}
                </h4>

                <p class="text-secondary small mb-4">
                    ${escapeHtml(slider.description)}
                </p>

                <div class="d-flex flex-wrap gap-2">

                    <button
                        type="button"
                        class="btn btn-light rounded-pill px-4 slider-edit-btn"
                        data-id="${slider._id}"
                    >
                        <i class="bi bi-pencil me-1"></i>
                        Düzenle
                    </button>

                    <button
                        type="button"
                        class="btn btn-outline-danger rounded-pill px-4 slider-delete-btn"
                        data-id="${slider._id}"
                    >
                        <i class="bi bi-trash me-1"></i>
                        Sil
                    </button>

                </div>

            </div>
        `;


        sliderAdminGrid.appendChild(col);

    });


    bindSliderCardButtons(sliders);

}


// --------------------------------------------------
// HTML GÜVENLİ HALE GETİR
// --------------------------------------------------

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// --------------------------------------------------
// SLIDERLARI GETİR
// --------------------------------------------------

async function loadSliders() {

    if (!sliderForm) {
        return;
    }

    try {

        const response =
            await fetch("/slider");

        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Sliderlar alınamadı."
            );

        }


        renderSliderCards(
            data.sliders || []
        );


    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Sliderlar yüklenirken hata oluştu."
        );

    }

}


// --------------------------------------------------
// SLIDER EKLE / DÜZENLE
// --------------------------------------------------

sliderForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const eyebrow =
            sliderEyebrow?.value.trim() || "";

        const titleBefore =
            sliderTitleBefore?.value.trim() || "";

        const titleHighlight =
            sliderTitleHighlight?.value.trim() || "";

        const titleAfter =
            sliderTitleAfter?.value.trim() || "";

        const description =
            sliderDescription?.value.trim() || "";


        if (
            !eyebrow ||
            !titleHighlight ||
            !description
        ) {

            showToast(
                "Lütfen zorunlu alanları doldurun."
            );

            return;
        }


        // Yeni slider ekleniyorsa görsel zorunlu
        if (
            !editingSliderId &&
            !sliderImage?.files.length
        ) {

            showToast(
                "Lütfen slider görseli seçin."
            );

            return;
        }


        const formData =
            new FormData();

        formData.append(
            "eyebrow",
            eyebrow
        );

        formData.append(
            "titleBefore",
            titleBefore
        );

        formData.append(
            "titleHighlight",
            titleHighlight
        );

        formData.append(
            "titleAfter",
            titleAfter
        );

        formData.append(
            "description",
            description
        );


        if (sliderImage?.files[0]) {

            formData.append(
                "image",
                sliderImage.files[0]
            );

        }


        const url =
            editingSliderId
                ? `/slider/${editingSliderId}`
                : "/slider";


        const method =
            editingSliderId
                ? "PUT"
                : "POST";


        try {

            saveSliderBtn.disabled = true;


            saveSliderBtn.innerHTML = editingSliderId
                ? `
                    <span
                        class="spinner-border spinner-border-sm me-1"
                    ></span>
                    Kaydediliyor...
                `
                : `
                    <span
                        class="spinner-border spinner-border-sm me-1"
                    ></span>
                    Ekleniyor...
                `;


            const response =
                await fetch(url, {
                    method,
                    body: formData
                });


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Slider kaydedilemedi."
                );

            }


            showToast(
                editingSliderId
                    ? "Slider başarıyla güncellendi."
                    : "Slider başarıyla eklendi."
            );


            resetSliderForm();

            await loadSliders();


        } catch (error) {

            console.error(error);

            showToast(
                error.message ||
                "Slider kaydedilirken hata oluştu."
            );

        } finally {

            saveSliderBtn.disabled = false;

            if (!editingSliderId) {

                saveSliderBtn.innerHTML = `
                    <i class="bi bi-plus-lg me-1"></i>
                    Slider Ekle
                `;

            }

        }

    }
);


// --------------------------------------------------
// DÜZENLE / SİL BUTONLARI
// --------------------------------------------------

function bindSliderCardButtons(sliders) {

    document
        .querySelectorAll(".slider-edit-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const sliderId =
                        button.dataset.id;

                    const slider =
                        sliders.find(
                            item =>
                                item._id === sliderId
                        );


                    if (!slider) {
                        return;
                    }


                    editingSliderId =
                        slider._id;


                    sliderEyebrow.value =
                        slider.eyebrow || "";

                    sliderTitleBefore.value =
                        slider.titleBefore || "";

                    sliderTitleHighlight.value =
                        slider.titleHighlight || "";

                    sliderTitleAfter.value =
                        slider.titleAfter || "";

                    sliderDescription.value =
                        slider.description || "";


                    sliderFormTitle.textContent =
                        "Sliderı Düzenle";


                    saveSliderBtn.innerHTML = `
                        <i class="bi bi-check-lg me-1"></i>
                        Değişiklikleri Kaydet
                    `;


                    cancelSliderEditBtn.classList.remove(
                        "d-none"
                    );


                    // Düzenlemede görsel zorunlu değil
                    sliderImage.required = false;


                    sliderImagePreview.innerHTML = `
                        <img
                            src="${slider.imageUrl}"
                            alt="Slider mevcut görseli"
                            class="w-100 h-100 object-fit-cover"
                        >
                    `;


                    showSection(
                        "slider"
                    );

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }
            );

        });


    document
        .querySelectorAll(".slider-delete-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const sliderId =
                        button.dataset.id;


                    if (!sliderId) {
                        return;
                    }


                    const confirmed =
                        confirm(
                            "Bu sliderı silmek istediğinize emin misiniz?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    try {

                        button.disabled = true;


                        const response =
                            await fetch(
                                `/slider/${sliderId}`,
                                {
                                    method: "DELETE"
                                }
                            );


                        const data =
                            await response.json();


                        if (
                            !response.ok ||
                            !data.success
                        ) {

                            throw new Error(
                                data.message ||
                                "Slider silinemedi."
                            );

                        }


                        if (
                            editingSliderId ===
                            sliderId
                        ) {

                            resetSliderForm();

                        }


                        showToast(
                            "Slider başarıyla silindi."
                        );


                        await loadSliders();


                    } catch (error) {

                        console.error(error);

                        showToast(
                            error.message ||
                            "Slider silinirken hata oluştu."
                        );


                    } finally {

                        button.disabled = false;

                    }

                }
            );

        });

}


// --------------------------------------------------
// DÜZENLEMEYİ İPTAL ET
// --------------------------------------------------

cancelSliderEditBtn?.addEventListener(
    "click",
    () => {

        resetSliderForm();

    }
);


// --------------------------------------------------
// İLK YÜKLEME
// --------------------------------------------------

loadSliders();


/* FOTOĞRAF SİL */

galleryDeleteButtons.forEach(button => {

    button.addEventListener("click", async () => {

        const galleryId =
            button.dataset.id;


        if (!galleryId) {
            return;
        }


        const confirmed = confirm(
            "Bu fotoğrafı silmek istediğinize emin misiniz?"
        );


        if (!confirmed) {
            return;
        }


        try {

            button.disabled = true;


            const response = await fetch(
                `/gallery/${galleryId}`,
                {
                    method: "DELETE"
                }
            );


            const data =
                await response.json();


            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Fotoğraf silinemedi."
                );
            }


            showToast(
                "Fotoğraf başarıyla silindi."
            );


            setTimeout(() => {
                window.location.href =
                    "/admin#gallery";
            }, 700);


        } catch (error) {

            console.error(error);

            showToast(
                error.message ||
                "Fotoğraf silinirken bir hata oluştu."
            );


        } finally {

            button.disabled = false;

        }

    });

});



/* Yönetici > Çıkış Yap */
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    try {
        const response = await fetch("/admin/logout", {
            method: "POST"
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Çıkış yapılamadı:", error);
    }
});

/* Basit bildirim */
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "logout-popover show";
  toast.innerHTML = `<i class="bi bi-check-circle"></i><span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 220);
  }, 2600);
}

window.showToast = showToast;

showSection(location.hash.replace("#", "") || "dashboard", false);

})();

const appointmentSubmitBtn = document.getElementById("appointmentSubmitBtn");

const params = new URLSearchParams(window.location.search);
const appointmentCooldownRemainingMs = appointmentSubmitBtn
    ? Number(appointmentSubmitBtn.dataset.cooldownRemaining || 0)
    : 0;

if (appointmentSubmitBtn) {
    const showAppointmentSuccess = (remainingMs) => {
        appointmentSubmitBtn.disabled = true;
        appointmentSubmitBtn.classList.remove("btn-dark", "btn-warning");
        appointmentSubmitBtn.classList.add("btn-success");
        appointmentSubmitBtn.innerHTML = `
            <i class="bi bi-check-circle me-1"></i>
            Randevunuz başarıyla oluşturuldu
        `;

        if (remainingMs > 0) {
            setTimeout(() => {
                appointmentSubmitBtn.disabled = false;
                appointmentSubmitBtn.classList.remove("btn-success");
                appointmentSubmitBtn.classList.add("btn-dark");
                appointmentSubmitBtn.innerHTML = `
                    Randevu Talebi Gönder
                    <i class="bi bi-arrow-right ms-1"></i>
                `;
            }, remainingMs);
        }
    };

    if (appointmentCooldownRemainingMs > 0) {
        showAppointmentSuccess(appointmentCooldownRemainingMs);
    }

    if (params.get("success") === "appointment") {
        showAppointmentSuccess(appointmentCooldownRemainingMs || 5 * 60 * 1000);
    }

    if (params.get("error") === "slot-full") {
        appointmentSubmitBtn.classList.remove("btn-dark");
        appointmentSubmitBtn.classList.add("btn-warning");

        appointmentSubmitBtn.innerHTML = `
            <i class="bi bi-exclamation-circle me-1"></i>
            Bu saat dolu, başka bir saat seçin
        `;

        setTimeout(() => {
            appointmentSubmitBtn.classList.remove("btn-warning");
            appointmentSubmitBtn.classList.add("btn-dark");

            appointmentSubmitBtn.innerHTML = `
                Randevu Talebi Gönder
                <i class="bi bi-arrow-right ms-1"></i>
            `;
        }, 3000);
    }

    if (params.get("error") === "server") {
        appointmentSubmitBtn.classList.remove("btn-dark");
        appointmentSubmitBtn.classList.add("btn-danger");

        appointmentSubmitBtn.innerHTML = `
            <i class="bi bi-x-circle me-1"></i>
            Bir hata oluştu, tekrar deneyin
        `;

        setTimeout(() => {
            appointmentSubmitBtn.classList.remove("btn-danger");
            appointmentSubmitBtn.classList.add("btn-dark");

            appointmentSubmitBtn.innerHTML = `
                Randevu Talebi Gönder
                <i class="bi bi-arrow-right ms-1"></i>
            `;
        }, 3000);
    }
}


/* URL'deki mesaj parametrelerini temizle */
if (params.get("success") || params.get("error")) {
    history.replaceState(
        null,
        "",
        window.location.pathname + window.location.hash
    );
}

/* HAKKIMIZDA AYARLARI */

/* Fotoğraf önizleme */
document
    .getElementById("aboutImage")
    ?.addEventListener("change", event => {

        const file = event.target.files[0];

        const preview =
            document.getElementById("aboutImagePreview");

        if (!file || !preview) return;

        const reader = new FileReader();

        reader.onload = () => {

            preview.innerHTML = `
                <img
                    src="${reader.result}"
                    alt="Hakkımızda önizleme"
                    class="w-100 h-100 object-fit-cover">
            `;

        };

        reader.readAsDataURL(file);
    });


/* Hakkımızda kaydet */
document
    .getElementById("saveAboutBtn")
    ?.addEventListener("click", async () => {

        const button =
            document.getElementById("saveAboutBtn");

        const title =
            document.getElementById("aboutTitle");

        const description1 =
            document.getElementById("aboutDescription1");

        const description2 =
            document.getElementById("aboutDescription2");

        const experienceYears =
            document.getElementById("aboutExperienceYears");

        const completedWorks =
            document.getElementById("aboutCompletedWorks");

        const image =
            document.getElementById("aboutImage");


        const formData = new FormData();

        formData.append(
            "title",
            title?.value.trim() || ""
        );

        formData.append(
            "description1",
            description1?.value.trim() || ""
        );

        formData.append(
            "description2",
            description2?.value.trim() || ""
        );

        formData.append(
            "experienceYears",
            experienceYears?.value.trim() || ""
        );

        formData.append(
            "completedWorks",
            completedWorks?.value.trim() || ""
        );


        /* Yeni fotoğraf seçildiyse gönder */
        if (image?.files[0]) {

            formData.append(
                "image",
                image.files[0]
            );

        }


        try {

            button.disabled = true;

            const response =
                await fetch("/about", {

                    method: "PUT",

                    body: formData

                });


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Hakkımızda ayarları kaydedilemedi."
                );

            }


            window.showToast(
                data.message || "Hakkımızda değişiklikleri başarıyla kaydedildi."
            );


        } catch (error) {

            console.error(error);

            window.showToast(
                error.message ||
                "Hakkımızda değişiklikleri kaydedilemedi."
            );

        } finally {

            button.disabled = false;

        }

    });

document.getElementById("loginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const message = document.getElementById("loginMessage");
    const button = form.querySelector('button[type="submit"]');

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const showMessage = (text, isError = false) => {
        message.textContent = text;
        message.classList.add("show");
        message.classList.toggle("error", isError);
        message.setAttribute("role", isError ? "alert" : "status");
    };

    try {
        button.disabled = true;
        showMessage("Giriş yapılıyor...");

        const response = await fetch("/admin/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            showMessage(data.message || "E-posta veya şifre hatalı.", true);
            return;
        }

        window.location.href = "/admin";

    } catch (error) {
        showMessage("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.", true);
    } finally {
        button.disabled = false;
    }
});

/* =========================================================
   BİLDİRİM SİSTEMİ
   ========================================================= */

const notificationPermissionBtn =
    document.getElementById(
        "notificationPermissionBtn"
    );

const notificationStatusDot =
    document.getElementById(
        "notificationStatusDot"
    );


// --------------------------------------------------
// BASE64 URL → UINT8ARRAY
// --------------------------------------------------

function urlBase64ToUint8Array(base64String) {

    const padding =
        "=".repeat(
            (4 - (base64String.length % 4)) % 4
        );

    const base64 =
        (
            base64String +
            padding
        )
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    const rawData =
        window.atob(base64);

    return Uint8Array.from(
        [...rawData].map(
            char => char.charCodeAt(0)
        )
    );
}


// --------------------------------------------------
// BİLDİRİM DURUMUNU GÜNCELLE
// --------------------------------------------------

function updateNotificationButton(
    enabled
) {

    if (!notificationPermissionBtn) {
        return;
    }

    if (enabled) {

        notificationPermissionBtn.title =
            "Bildirimler Açık";

        notificationPermissionBtn.setAttribute(
            "aria-label",
            "Bildirimler Açık"
        );

        notificationPermissionBtn.innerHTML = `
            <i class="bi bi-bell-fill"></i>
            <span
                class="notification-dot"
                id="notificationStatusDot"
            ></span>
        `;

    } else {

        notificationPermissionBtn.title =
            "Bildirimleri Aç";

        notificationPermissionBtn.setAttribute(
            "aria-label",
            "Bildirimleri Aç"
        );

    }

}


// --------------------------------------------------
// BİLDİRİM ABONELİĞİNİ KAYDET
// --------------------------------------------------

async function savePushSubscription(
    subscription
) {

    const response =
        await fetch(
            "/notifications/subscribe",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        subscription
                    )
            }
        );


    const data =
        await response.json();


    if (
        !response.ok ||
        !data.success
    ) {

        throw new Error(
            data.message ||
            "Bildirim aboneliği kaydedilemedi."
        );

    }

}

// --------------------------------------------------
// BİLDİRİMLERİ AKTİF ET
// --------------------------------------------------

async function enableNotifications() {

    if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
    ) {

        throw new Error(
            "Bu tarayıcı push bildirimlerini desteklemiyor."
        );

    }


    if (
        !window.isSecureContext &&
        location.hostname !== "localhost"
    ) {

        throw new Error(
            "Bildirimler için HTTPS bağlantısı gerekiyor."
        );

    }


    const permission =
        await Notification.requestPermission();


    if (
        permission !== "granted"
    ) {

        throw new Error(
            "Bildirim izni verilmedi."
        );

    }


    const registration =
        await navigator.serviceWorker.register(
            "/sw.js"
        );


    const keyResponse =
        await fetch(
            "/notifications/public-key"
        );


    const keyData =
        await keyResponse.json();


    if (
        !keyResponse.ok ||
        !keyData.success ||
        !keyData.publicKey
    ) {

        throw new Error(
            "Bildirim anahtarı alınamadı."
        );

    }


    let subscription =
        await registration.pushManager.getSubscription();


    if (!subscription) {

        subscription =
            await registration.pushManager.subscribe(
                {
                    userVisibleOnly: true,

                    applicationServerKey:
                        urlBase64ToUint8Array(
                            keyData.publicKey
                        )
                }
            );

    }


    await savePushSubscription(
        subscription.toJSON()
    );


    updateNotificationButton(
        true
    );


    showToast(
        "Bildirimler başarıyla açıldı."
    );

}

// --------------------------------------------------
// ZİL BUTONU
// --------------------------------------------------

notificationPermissionBtn?.addEventListener(
    "click",
    async () => {

        try {

            notificationPermissionBtn.disabled =
                true;

            await enableNotifications();

        } catch (error) {

            console.error(
                "Bildirimler açılamadı:",
                error
            );

            showToast(
                error.message ||
                "Bildirimler açılamadı."
            );

        } finally {

            notificationPermissionBtn.disabled =
                false;

        }

    }
);

// --------------------------------------------------
// SAYFA AÇILINCA MEVCUT İZNİ KONTROL ET
// --------------------------------------------------

async function checkNotificationStatus() {

    if (
        !("serviceWorker" in navigator) ||
        !("Notification" in window)
    ) {
        return;
    }


    if (
        Notification.permission !==
        "granted"
    ) {
        return;
    }


    try {

        const registration =
            await navigator.serviceWorker.register(
                "/sw.js"
            );


        const subscription =
            await registration.pushManager
                .getSubscription();


        if (subscription) {

            await savePushSubscription(
                subscription.toJSON()
            );

            updateNotificationButton(
                true
            );

        }

    } catch (error) {

        console.error(
            "Bildirim durumu kontrol edilemedi:",
            error
        );

    }

}
checkNotificationStatus();

/* RANDEVU SİL — dinamik eklenen satırlar için event delegation */

document.addEventListener("click", async event => {
    const button = event.target.closest(".appointment-delete-btn");
    if (!button) return;

    const appointmentId = button.dataset.id;
    if (!appointmentId) return;

    const confirmed = confirm(
        "Bu randevuyu silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz."
    );
    if (!confirmed) return;

    try {
        button.disabled = true;
        const response = await fetch(`/appointments/${appointmentId}`, {
            method: "DELETE"
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Randevu silinemedi.");
        }

        button.closest("tr")?.remove();
        showToast("Randevu başarıyla silindi.");

        const tbody = document.querySelector("#appointments tbody");
        if (tbody && !tbody.querySelector("tr[data-appointment-id]")) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-secondary">
                        <i class="bi bi-calendar-x d-block fs-3 mb-2"></i>
                        Henüz randevu bulunmuyor.
                    </td>
                </tr>
            `;
        }

        window.applyAppointmentFilters?.();
    } catch (error) {
        console.error(error);
        showToast(error.message || "Randevu silinirken hata oluştu.");
    } finally {
        button.disabled = false;
    }
});


/* ========================================
   PUBLIC BEFORE / AFTER SLIDER
======================================== */

const publicBeforeAfter =
    document.querySelector(".before-after-container");


if (publicBeforeAfter) {

    const beforeArea =
        publicBeforeAfter.querySelector(
            ".before-after-before"
        );

    const divider =
        publicBeforeAfter.querySelector(
            ".before-after-divider"
        );


    let isDragging = false;


    /* ========================================
       SLIDERI GÜNCELLE
    ======================================== */

    const moveSlider = clientX => {

        const rect =
            publicBeforeAfter.getBoundingClientRect();


        let percentage =
            ((clientX - rect.left) / rect.width) * 100;


        /* 0 ile 100 arasında tut */

        percentage =
            Math.max(
                0,
                Math.min(100, percentage)
            );


        /* BEFORE alanını kırp */

        beforeArea.style.clipPath =
            `inset(0 ${100 - percentage}% 0 0)`;


        /* Ortadaki çizgiyi taşı */

        divider.style.left =
            `${percentage}%`;

    };


    /* ========================================
       BAŞLANGIÇ %50
    ======================================== */

    moveSlider(
        publicBeforeAfter.getBoundingClientRect().left +
        publicBeforeAfter.getBoundingClientRect().width / 2
    );


    /* ========================================
       BAŞLAT
    ======================================== */

    publicBeforeAfter.addEventListener(
        "pointerdown",
        event => {

            isDragging = true;

            publicBeforeAfter.setPointerCapture(
                event.pointerId
            );

            moveSlider(
                event.clientX
            );

        }
    );


    /* ========================================
       SÜRÜKLE
    ======================================== */

    publicBeforeAfter.addEventListener(
        "pointermove",
        event => {

            if (!isDragging) {
                return;
            }

            moveSlider(
                event.clientX
            );

        }
    );


    /* ========================================
       BIRAK
    ======================================== */

    publicBeforeAfter.addEventListener(
        "pointerup",
        () => {

            isDragging = false;

        }
    );


    publicBeforeAfter.addEventListener(
        "pointercancel",
        () => {

            isDragging = false;

        }
    );

}