const STORAGE_KEY = "nurul-huda-posts-v1";

const seed = [
    {
        id: "post-1",
        title: "SMP Nurul Huda Mengadakan Kegiatan Literasi Pagi",
        slug: "kegiatan-literasi-pagi",
        category: "Kegiatan",
        image: "",
        excerpt:
            "Program literasi pagi menjadi salah satu upaya menumbuhkan kebiasaan membaca dan rasa ingin tahu siswa.",
        content: [
            "SMP Nurul Huda terus mendorong budaya literasi melalui kegiatan membaca sebelum pembelajaran dimulai. Siswa diberikan kesempatan untuk membaca buku sesuai minat dan kemudian berbagi hal menarik yang mereka temukan.",
            "Kegiatan ini diharapkan dapat meningkatkan kemampuan memahami bacaan, memperluas wawasan, dan membangun kebiasaan belajar mandiri. Contoh artikel ini merupakan konten ilustrasi untuk pengujian website."
        ],
        author: "Admin Sekolah",
        status: "Terbit",
        updatedAt: "2026-10-20T08:00:00.000Z"
    },
    {
        id: "post-2",
        title: "Pembiasaan Hidup Bersih di Lingkungan Sekolah",
        slug: "pembiasaan-hidup-bersih",
        category: "Pendidikan",
        image: "",
        excerpt:
            "Menjaga kebersihan lingkungan sekolah adalah tanggung jawab bersama seluruh warga sekolah.",
        content: [
            "Lingkungan yang bersih dan tertata membantu menciptakan suasana belajar yang nyaman. Seluruh warga sekolah dapat berpartisipasi melalui kebiasaan membuang sampah pada tempatnya dan merawat fasilitas bersama.",
            "Artikel ini adalah contoh konten demo dan perlu disesuaikan dengan kegiatan resmi sekolah sebelum dipublikasikan."
        ],
        author: "Tim Redaksi",
        status: "Terbit",
        updatedAt: "2026-10-18T07:30:00.000Z"
    },
    {
        id: "post-3",
        title: "Rencana Pekan Kreativitas Siswa",
        slug: "rencana-pekan-kreativitas-siswa",
        category: "Pengumuman",
        image: "",
        excerpt:
            "Draft internal untuk rencana kegiatan kreativitas siswa pada akhir semester.",
        content: [
            "Tuliskan detail kegiatan setelah jadwal dan informasi resmi disepakati."
        ],
        author: "Admin Sekolah",
        status: "Draft",
        updatedAt: "2026-10-21T09:00:00.000Z"
    }
];

const app = document.getElementById("app");

document.getElementById("year").textContent =
    new Date().getFullYear();


// ========================================
// MANAJEMEN DATA ARTIKEL
// ========================================

function getPosts() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);

        return data
            ? JSON.parse(data)
            : seed.map((post) => ({ ...post }));
    } catch {
        return seed.map((post) => ({ ...post }));
    }
}

function savePosts(posts) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(posts)
    );
}


// ========================================
// FUNGSI BANTU
// ========================================

function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Tanggal tidak tersedia";
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(date);
}

function slugify(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 180);
}

function cover(image) {
    if (image) {
        return `
            <div class="cover">
                <img
                    src="${escapeHtml(image)}"
                    alt=""
                    loading="lazy"
                >
            </div>
        `;
    }

    return `
        <div class="cover" aria-hidden="true">
            📚
        </div>
    `;
}


// ========================================
// KARTU ARTIKEL
// ========================================

function card(post) {
    return `
        <article class="post-card">
            ${cover(post.image)}

            <div class="post-body">
                <div class="meta">
                    <span class="pill">
                        ${escapeHtml(post.category)}
                    </span>

                    <span>
                        ${formatDate(post.updatedAt)}
                    </span>
                </div>

                <h3>${escapeHtml(post.title)}</h3>

                <p>${escapeHtml(post.excerpt)}</p>

                <a
                    class="read-link"
                    href="#/blog/${encodeURIComponent(post.slug)}"
                >
                    Read More →
                </a>
            </div>
        </article>
    `;
}


// ========================================
// HALAMAN BLOG PUBLIK
// ========================================

function renderHome() {
    const posts = getPosts()
        .filter((post) => post.status === "Terbit")
        .sort(
            (a, b) =>
                new Date(b.updatedAt) -
                new Date(a.updatedAt)
        );

    app.innerHTML = `
        <section class="hero">
            <div>
                <span class="eyebrow">
                    Informasi • Kegiatan • Inspirasi
                </span>

                <h1>Blog SMP Nurul Huda</h1>

                <p>
                    Ikuti kabar, kegiatan, dan cerita pembelajaran
                    dari lingkungan SMP Nurul Huda.
                </p>
            </div>

            <div class="hero-art" aria-hidden="true">
                📖
            </div>
        </section>

        <div class="section-head">
            <div>
                <h2>Artikel Terbaru</h2>

                <p>
                    Artikel yang sudah diterbitkan oleh admin sekolah.
                </p>
            </div>
        </div>

        <div class="toolbar">
            <input
                id="search"
                aria-label="Cari artikel"
                placeholder="Cari judul atau isi artikel…"
            >

            <select
                id="category"
                aria-label="Filter kategori"
            >
                <option value="">Semua kategori</option>

                ${
                    [...new Set(posts.map((post) => post.category))]
                        .sort()
                        .map(
                            (category) => `
                                <option value="${escapeHtml(category)}">
                                    ${escapeHtml(category)}
                                </option>
                            `
                        )
                        .join("")
                }
            </select>
        </div>

        <div
            id="post-grid"
            class="${posts.length ? "grid" : ""}"
        >
            ${
                posts.length
                    ? posts.map(card).join("")
                    : `
                        <div class="empty">
                            Belum ada artikel yang diterbitkan.
                        </div>
                    `
            }
        </div>
    `;

    const update = () => {
        const query = document
            .getElementById("search")
            .value
            .toLowerCase()
            .trim();

        const category =
            document.getElementById("category").value;

        const filtered = posts.filter((post) => {
            const matchesCategory =
                !category || post.category === category;

            const searchableText = [
                post.title,
                post.excerpt,
                post.content.join(" "),
                post.category
            ]
                .join(" ")
                .toLowerCase();

            return (
                matchesCategory &&
                searchableText.includes(query)
            );
        });

        const element =
            document.getElementById("post-grid");

        element.className = filtered.length ? "grid" : "";

        element.innerHTML = filtered.length
            ? filtered.map(card).join("")
            : `
                <div class="empty">
                    Artikel tidak ditemukan.
                    Coba kata kunci atau kategori lain.
                </div>
            `;
    };

    document
        .getElementById("search")
        .addEventListener("input", update);

    document
        .getElementById("category")
        .addEventListener("change", update);
}


// ========================================
// HALAMAN DETAIL ARTIKEL
// ========================================

function renderDetail(slug) {
    const post = getPosts().find(
        (item) =>
            item.slug === slug &&
            item.status === "Terbit"
    );

    if (!post) {
        app.innerHTML = `
            <section class="post-detail">
                <h1>Artikel tidak ditemukan</h1>

                <p>
                    Artikel mungkin belum diterbitkan
                    atau alamatnya tidak tersedia.
                </p>

                <a class="back" href="#/">
                    ← Kembali ke Blog
                </a>
            </section>
        `;

        return;
    }

    app.innerHTML = `
        <article class="post-detail">
            <a class="back" href="#/">
                ← Kembali ke Blog
            </a>

            <div class="meta">
                <span class="pill">
                    ${escapeHtml(post.category)}
                </span>

                <span>
                    ${formatDate(post.updatedAt)}
                </span>

                <span>
                    Oleh ${escapeHtml(post.author)}
                </span>
            </div>

            <h1>${escapeHtml(post.title)}</h1>

            <p>${escapeHtml(post.excerpt)}</p>

            <div class="detail-cover">
                ${
                    post.image
                        ? `
                            <img
                                src="${escapeHtml(post.image)}"
                                alt="${escapeHtml(post.title)}"
                            >
                        `
                        : "📚"
                }
            </div>

            <div class="article-content">
                ${
                    post.content
                        .map(
                            (paragraph) => `
                                <p>
                                    ${escapeHtml(paragraph)}
                                </p>
                            `
                        )
                        .join("")
                }
            </div>

            <a class="back" href="#/">
                ← Lihat artikel lainnya
            </a>
        </article>
    `;
}


// ========================================
// NOTIFIKASI ADMIN
// ========================================

function notice(message, success = true) {
    const element = document.getElementById("notice");

    if (!element) {
        return;
    }

    element.className = `notice show ${
        success ? "success" : "fail"
    }`;

    element.textContent = message;
}


// ========================================
// DASHBOARD ADMIN
// ========================================

function renderAdmin(editId = "") {
    let posts = getPosts();

    let editing = posts.find(
        (post) => post.id === editId
    );

    if (editId && !editing) {
        editing = null;
    }

    const terbit = posts.filter(
        (post) => post.status === "Terbit"
    ).length;

    const draft = posts.length - terbit;

    app.innerHTML = `
        <div class="admin-title">
            <div>
                <span class="eyebrow">
                    Area pengelola
                </span>

                <h1>Blog & Artikel</h1>

                <p>
                    Kelola artikel, simpan draft,
                    dan terbitkan berita sekolah.
                </p>
            </div>

            <a class="btn btn-secondary" href="#/">
                ← Lihat Blog Publik
            </a>
        </div>

        <div class="stats">
            <div class="stat">
                <strong>${posts.length}</strong>
                <span>Total artikel</span>
            </div>

            <div class="stat">
                <strong>${terbit}</strong>
                <span>Terbit</span>
            </div>

            <div class="stat">
                <strong>${draft}</strong>
                <span>Draft</span>
            </div>
        </div>

        <div class="admin-layout">
            <section class="panel">
                <h2>Daftar Artikel</h2>

                <input
                    class="admin-search"
                    id="admin-search"
                    placeholder="Cari artikel admin…"
                >

                <div
                    class="admin-list"
                    id="admin-list"
                ></div>

                <p class="hint">
                    Artikel Draft hanya terlihat di area admin,
                    tidak ditampilkan pada blog publik.
                </p>
            </section>

            <section class="panel">
                <h2 id="form-title">
                    ${editing ? "Edit Artikel" : "Tambah Artikel"}
                </h2>

                <div
                    id="notice"
                    class="notice"
                    role="status"
                    aria-live="polite"
                ></div>

                <form id="post-form">
                    <input
                        type="hidden"
                        name="id"
                        value="${escapeHtml(editing?.id || "")}"
                    >

                    <div class="form-group">
                        <label for="title">
                            Judul artikel *
                        </label>

                        <input
                            id="title"
                            name="title"
                            required
                            minlength="3"
                            maxlength="180"
                            value="${escapeHtml(editing?.title || "")}"
                            placeholder="Masukkan judul artikel"
                        >
                    </div>

                    <div class="form-grid">
                        <div class="form-group">
                            <label for="slug">
                                Slug URL *
                            </label>

                            <input
                                id="slug"
                                name="slug"
                                required
                                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                                maxlength="180"
                                value="${escapeHtml(editing?.slug || "")}"
                                placeholder="judul-artikel"
                            >

                            <small>
                                Huruf kecil, angka, dan tanda hubung;
                                harus unik.
                            </small>
                        </div>

                        <div class="form-group">
                            <label for="category">
                                Kategori *
                            </label>

                            <input
                                id="category"
                                name="category"
                                required
                                maxlength="60"
                                value="${escapeHtml(editing?.category || "")}"
                                placeholder="Kegiatan / Pendidikan"
                            >
                        </div>

                        <div class="form-group full">
                            <label for="image">
                                Path gambar *
                            </label>

                            <input
                                id="image"
                                name="image"
                                required
                                maxlength="500"
                                value="${escapeHtml(editing?.image || "")}"
                                placeholder="/images/artikel.jpg atau https://..."
                            >

                            <small>
                                Isi path aset gambar yang tersedia.
                                Form ini tidak mengunggah file.
                            </small>
                        </div>

                        <div class="form-group full">
                            <label for="excerpt">
                                Ringkasan *
                            </label>

                            <textarea
                                id="excerpt"
                                name="excerpt"
                                required
                                minlength="10"
                                maxlength="220"
                                placeholder="Ringkasan 10–220 karakter"
                            >${escapeHtml(editing?.excerpt || "")}</textarea>
                        </div>

                        <div class="form-group">
                            <label for="author">
                                Penulis *
                            </label>

                            <input
                                id="author"
                                name="author"
                                required
                                minlength="2"
                                maxlength="120"
                                value="${escapeHtml(editing?.author || "Admin Sekolah")}"
                            >
                        </div>

                        <div class="form-group">
                            <label for="status">
                                Status *
                            </label>

                            <select id="status" name="status">
                                <option ${
                                    editing?.status === "Draft"
                                        ? "selected"
                                        : ""
                                }>
                                    Draft
                                </option>

                                <option ${
                                    editing?.status === "Terbit"
                                        ? "selected"
                                        : ""
                                }>
                                    Terbit
                                </option>
                            </select>
                        </div>

                        <div class="form-group full">
                            <label for="content">
                                Isi artikel *
                            </label>

                            <textarea
                                id="content"
                                name="content"
                                required
                                placeholder="Satu paragraf per baris kosong."
                            >${escapeHtml(
                                editing?.content?.join("\n\n") || ""
                            )}</textarea>

                            <small>
                                Isi akan disimpan sebagai array paragraf,
                                bukan HTML.
                            </small>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button
                            class="btn btn-primary"
                            type="submit"
                        >
                            ${
                                editing
                                    ? "Simpan Perubahan"
                                    : "Simpan Artikel"
                            }
                        </button>

                        <button
                            class="btn btn-secondary"
                            type="button"
                            id="reset-form"
                        >
                            Kosongkan
                        </button>
                    </div>
                </form>
            </section>
        </div>
    `;


    // Menampilkan daftar artikel di dashboard admin.

    const drawList = (query = "") => {
        const list = document.getElementById("admin-list");

        const filtered = getPosts()
            .filter((post) =>
                [
                    post.title,
                    post.category,
                    post.author,
                    post.slug
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(query.toLowerCase())
            )
            .sort(
                (a, b) =>
                    new Date(b.updatedAt) -
                    new Date(a.updatedAt)
            );

        list.innerHTML = filtered.length
            ? filtered
                .map(
                    (post) => `
                        <div class="admin-item">
                            <div>
                                <h3>
                                    ${escapeHtml(post.title)}
                                </h3>

                                <small>
                                    ${escapeHtml(post.category)}
                                    ·
                                    ${escapeHtml(post.slug)}
                                </small>

                                <div style="margin-top: 7px">
                                    <span class="status ${post.status.toLowerCase()}">
                                        ${post.status}
                                    </span>
                                </div>
                            </div>

                            <div class="admin-actions">
                                <button
                                    class="btn btn-secondary"
                                    data-edit="${escapeHtml(post.id)}"
                                >
                                    Edit
                                </button>

                                <button
                                    class="btn ${
                                        post.status === "Terbit"
                                            ? "btn-secondary"
                                            : "btn-primary"
                                    }"
                                    data-toggle="${escapeHtml(post.id)}"
                                >
                                    ${
                                        post.status === "Terbit"
                                            ? "Jadikan Draft"
                                            : "Terbitkan"
                                    }
                                </button>

                                <button
                                    class="btn btn-danger"
                                    data-delete="${escapeHtml(post.id)}"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    `
                )
                .join("")
            : `
                <div class="empty">
                    Belum ada artikel yang cocok.
                </div>
            `;
    };

    drawList();

    document
        .getElementById("admin-search")
        .addEventListener("input", (event) => {
            drawList(event.target.value);
        });


    // Aksi Edit, Terbitkan, Jadikan Draft, dan Hapus.

    document
        .getElementById("admin-list")
        .addEventListener("click", (event) => {
            const button = event.target.closest("button");

            if (!button) {
                return;
            }

            const id =
                button.dataset.edit ||
                button.dataset.toggle ||
                button.dataset.delete;

            if (button.dataset.edit) {
                renderAdmin(id);
                return;
            }

            const data = getPosts();

            const post = data.find(
                (item) => item.id === id
            );

            if (!post) {
                return;
            }

            if (button.dataset.toggle) {
                post.status =
                    post.status === "Terbit"
                        ? "Draft"
                        : "Terbit";

                post.updatedAt = new Date().toISOString();

                savePosts(data);
                renderAdmin();

                return;
            }

            if (
                button.dataset.delete &&
                confirm(
                    `Hapus artikel "${post.title}"? Tindakan ini tidak dapat dibatalkan.`
                )
            ) {
                savePosts(
                    data.filter((item) => item.id !== id)
                );

                renderAdmin();
            }
        });


    // Membuat slug otomatis berdasarkan judul.

    const form = document.getElementById("post-form");

    form.elements.title.addEventListener("input", () => {
        if (!form.elements.id.value) {
            form.elements.slug.value = slugify(
                form.elements.title.value
            );
        }
    });


    // Mengosongkan form.

    document
        .getElementById("reset-form")
        .addEventListener("click", () => {
            renderAdmin();
        });


    // Menyimpan artikel.

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(form);

        const post = {
            id:
                String(formData.get("id") || "") ||
                `post-${Date.now()}`,

            title: String(formData.get("title")).trim(),
            slug: String(formData.get("slug")).trim(),
            category: String(formData.get("category")).trim(),
            image: String(formData.get("image")).trim(),
            excerpt: String(formData.get("excerpt")).trim(),

            content: String(formData.get("content"))
                .split(/\n\s*\n/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean),

            author: String(formData.get("author")).trim(),
            status: String(formData.get("status")),
            updatedAt: new Date().toISOString()
        };


        // Validasi judul.

        if (
            post.title.length < 3 ||
            post.title.length > 180
        ) {
            return notice(
                "Judul harus 3–180 karakter.",
                false
            );
        }


        // Validasi slug.

        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) {
            return notice(
                "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.",
                false
            );
        }


        // Validasi data lainnya.

        if (
            post.category.length > 60 ||
            post.image.length > 500 ||
            post.excerpt.length < 10 ||
            post.excerpt.length > 220 ||
            post.author.length < 2 ||
            post.author.length > 120 ||
            post.content.length < 1 ||
            post.content.some(
                (paragraph) => paragraph.length > 5000
            )
        ) {
            return notice(
                "Periksa kategori, path gambar, ringkasan, penulis, dan isi artikel.",
                false
            );
        }


        // Memastikan slug unik.

        const data = getPosts();

        const duplicateSlug = data.some(
            (item) =>
                item.slug === post.slug &&
                item.id !== post.id
        );

        if (duplicateSlug) {
            return notice(
                "Slug sudah digunakan artikel lain. Gunakan slug yang unik.",
                false
            );
        }


        // Menyimpan perubahan atau artikel baru.

        const index = data.findIndex(
            (item) => item.id === post.id
        );

        if (index >= 0) {
            data[index] = post;
        } else {
            data.push(post);
        }

        savePosts(data);
        renderAdmin();

        notice(
            post.status === "Terbit"
                ? "Artikel berhasil disimpan dan diterbitkan."
                : "Draft artikel berhasil disimpan."
        );
    });
}


// ========================================
// NAVIGASI HALAMAN
// ========================================

function route() {
    const parts = decodeURI(
        location.hash.replace(/^#\/?/, "")
    )
        .split("/")
        .filter(Boolean);

    if (parts[0] === "admin") {
        renderAdmin();
    } else if (parts[0] === "blog" && parts[1]) {
        renderDetail(parts[1]);
    } else {
        renderHome();
    }
}

window.addEventListener("hashchange", route);

route();