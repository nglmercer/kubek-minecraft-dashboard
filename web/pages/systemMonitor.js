document.addEventListener('DOMContentLoaded', function() {
    KubekUI.setTitle("Kubek | {{sections.systemMonitor}}");
    KubekHardware.getSummary((data) => {
        // Load system environment variables
        console.log("data", data);
        const envTable = document.getElementById('enviroment-table');
        for (const [key, value] of objectEntries(data.enviroment)) {
            const row = document.createElement('tr');
            row.innerHTML = `<th>${key}</th><td>${value}</td>`;
            envTable.appendChild(row);
        }

        // Load network interfaces
        const networksTable = document.getElementById('networks-table');
        for (const [key, value] of objectEntries(data.networkInterfaces)) {
            let ips = "";
            value.forEach(function(inner) {
                ips += `<span>${inner.address} <sup>${inner.family}</sup></span><br>`;
            });
            const row = document.createElement('tr');
            row.innerHTML = `<th>${key}</th><td>${ips}</td>`;
            networksTable.appendChild(row);
        }

        // Load disks
        const disksTable = document.getElementById('disks-table');
        data.disks.forEach((disk) => {
            let letter = disk["_mounted"];
            let total = disk["_blocks"];
            let used = disk["_used"];
            let free = disk["_available"];
            
            if (data.platform.name === "Linux") {
                total *= 1024;
                used *= 1024;
                free *= 1024;
            }
            
            total = KubekUtils.humanizeFileSize(total);
            used = KubekUtils.humanizeFileSize(used);
            free = KubekUtils.humanizeFileSize(free);
            let percent = disk["_capacity"];
            
            const row = document.createElement('tr');
            row.innerHTML = `<th>${letter}</th><td>${used}</td><td>${free}</td><td>${total}</td><td>${percent}</td>`;
            disksTable.appendChild(row);
        });

        // Load other parameters
        document.getElementById('os-name').innerHTML = `${data.platform.version} <sup>${data.platform.arch}</sup>`;
        document.getElementById('os-build').textContent = data.platform.release;
        document.getElementById('total-ram').textContent = `${data.totalmem} Mb`;
        document.getElementById('kubek-uptime').textContent = KubekUtils.humanizeSeconds(data.uptime);
        document.getElementById('cpu-model').textContent = `${data.cpu.model} (${data.cpu.cores} cores)`;
        document.getElementById('cpu-speed').textContent = `${data.cpu.speed} MHz`;
    });
    function objectEntries(obj) {
        if (obj === null || typeof obj !== "object") {
            console.log("obj is not an object", typeof obj, obj);
            return [];
        }
        return Object.entries(obj);
    }
});

