function generateString() {
    const length = document.getElementById('length').value;
    const charType = document.querySelector('input[name="charType"]:checked').value;

    let characters = '';
    if (charType === 'lowercase') {
        characters = 'abcdefghijklmnopqrstuvwxyz';
    } else if (charType === 'capital') {
        characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    } else if (charType === 'numbers') {
        characters = '0123456789';
    } else if (charType === 'combination') {
        characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    }

    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    document.getElementById('generatedString').innerText = result;
    document.getElementById('copyConfirmation').style.display = 'none';
}

function copyToClipboard() {
    const generatedString = document.getElementById('generatedString').innerText;
    navigator.clipboard.writeText(generatedString).then(() => {
        document.getElementById('copyConfirmation').style.display = 'block';
        setTimeout(() => {
            document.getElementById('copyConfirmation').style.display = 'none';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}
