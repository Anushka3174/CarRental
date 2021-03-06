async function issuePassport() {
    const passport = {
        name: document.getElementById("name").value,
        address: document.getElementById("address").value,
        passportNumber: document.getElementById("passport").value,
        dob: document.getElementById("dob").value,
    }
    openModal("Scan this code to accept a connectionless credential:");
    hideQRCode();
    showSpinner();
    axios.post('/api/issue', passport).then(async (response) => {
        setQRCodeImage(response.data.offerUrl);
        hideSpinner();
        showQRCode();
    });
}

async function verifyPassport() {
    hideAccepted();
    openModal("Scan this code to verify the passport credential:");
    hideQRCode();
    showSpinner();
    let response = await axios.post('/api/verify');
    let verificationId = response.data.verificationId;
    console.log("this is verification detail",response.data)
    setQRCodeImage(response.data.verificationRequestUrl);
    hideSpinner();
    showQRCode();

    let verification = {state: "Requested"};
    let timedOut = false;
    setTimeout(() => timedOut = true, 1000 * 60);
    while (!timedOut && verification.state === "Requested") {
        let checkResponse = await axios.get('/api/checkVerification', {params: {verificationId: verificationId }});
        verification = checkResponse.data.verification;
    }

    hideQRCode();
    closeModal();
    if (verification.state === "Accepted" && verification.proof.VerifyAge) {

        await showAccepted(verification.proof.VerifyAge.attributes["DOB"],true);

        } else if(verification.state === "Accepted" ){
        await showAccepted(verification.proof,false);
    }
        // setAcceptedData(
        //     verification.proof.passport.attributes["Full Name"],
        //     verification.proof.passport.attributes["Passport Number"]
        // );
}

function openModal(text) {
    modal.style.display = "block";
    modalText.innerText = text;
}

function closeModal() {
    modal.style.display = "none";
}

function hideQRCode() {
    qr.style.display = "none";
}

function showQRCode() {
    qr.style.display = "block";
}

function setQRCodeImage(url) {
    qr.src = 'https://chart.googleapis.com/chart?cht=qr&chl=' + url + '&chs=300x300&chld=L|1';
}

function hideSpinner() {
    spinner.style.display = "none";
}

function showSpinner() {
    spinner.style.display = "block";
}

function hideAccepted() {
    accepted.style.display = "none";
}

async function showAccepted  (dob, rightCredential) {
    console.log("This is the parameter received", rightCredential)
    let todayDate = new Date().getTime();
    let birthDate = new Date(dob).getTime();
    let age = (todayDate - birthDate) / (1000 * 60 * 60 * 24 * 365);
    console.log("AGE",age);
    if(!rightCredential){
        accepted.style.display = "block";
        acceptedAge.innerHTML="Please present the age credential";
    }
    else if(age>25){
        accepted.style.display = "block";
    }
}

function setAcceptedData(name, passportNumber) {
    acceptedName.value = name;
    acceptedNumber.value = passportNumber;
}

function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
