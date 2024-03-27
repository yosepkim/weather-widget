async function callHarper() {

    const response = await fetch("https://harper-atl-edgecloud9.harperdbcloud.com:9926/weather-widget/?key=109-c", {
        method: "GET",
        headers: { 'Authorization': 'Basic bWV0cm86SWxvdmVBa2FtYWkyMDI0Kg==', 'Content-Type': 'application/json'},
    });
    const records = await response.json();
    console.log(records[0].value);
}

callHarper();