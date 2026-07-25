import re

with open('src/app.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

age_fn = """
const computeAgeYears = (dob, testDate) => {
    if (!dob || !testDate) return '';
    const birthDate = new Date(dob);
    const dateOfTest = new Date(testDate);
    if (isNaN(birthDate) || isNaN(dateOfTest)) return '';
    let age = dateOfTest.getFullYear() - birthDate.getFullYear();
    const m = dateOfTest.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && dateOfTest.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
"""

content = content.replace('const App = () => {', age_fn + '\nconst App = () => {')

with open('src/app.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
