function generateString() {
    const length = document.getElementById('length').value;
    const checkboxes = document.querySelectorAll('input[name="charType"]:checked');
    
    let characters = '';
    checkboxes.forEach((checkbox) => {
        if (checkbox.value === 'lowercase') {
            characters += 'abcdefghijklmnopqrstuvwxyz';
        } else if (checkbox.value === 'capital') {
            characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        } else if (checkbox.value === 'numbers') {
            characters += '0123456789';
        } else if (checkbox.value === 'binary') {
            characters += '01';
        }
    });

    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    document.getElementById('generatedString').innerText = result;
    document.getElementById('copyConfirmation').style.display = 'none';
}
