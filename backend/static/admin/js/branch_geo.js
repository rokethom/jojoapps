document.addEventListener("DOMContentLoaded", function () {
    const areaInput = document.getElementById("id_area");
    const latInput = document.getElementById("id_latitude");
    const lngInput = document.getElementById("id_longitude");

    if (!areaInput) return;

    const btn = document.createElement("button");
    btn.innerText = "🌍 Ambil dari Area";
    btn.type = "button";
    btn.style.marginTop = "10px";

    areaInput.parentNode.appendChild(btn);

    btn.addEventListener("click", async function () {
        const area = areaInput.value;

        if (!area) {
            alert("Isi area dulu!");
            return;
        }

        try {
            const response = await fetch(`/api/branch/geocode/?area=${encodeURIComponent(area)}`);
            const data = await response.json();

            if (data.latitude && data.longitude) {
                latInput.value = data.latitude;
                lngInput.value = data.longitude;

                alert("Lat Long berhasil diisi!");
            } else {
                alert("Lokasi tidak ditemukan");
            }
        } catch (err) {
            alert("Error ambil lokasi");
        }
    });
});