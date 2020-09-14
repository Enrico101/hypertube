function setCookie(prefered_language)
{
    //DELETE THE COOKIE
    document.cookie = "preferred_language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "preferred_language="+prefered_language+"; path=/";
}

function getCookie()
{
    if (document.cookie)
    {
        if (document.cookie.length > 0)
        {
            var splitArray = document.cookie.split("=");
            return splitArray[1];
        }
        else
        {
            return null;
        }
    }
    else
    {
        return null;
    }
}

function setPreferedLanguageIndex()
{
    var prefered_language = getCookie();
    if (prefered_language == null)
    {
        var signupButton = document.getElementById("signupButton");
        var loginButton = document.getElementById("loginButton");
        var title = document.getElementById("title");

        var languageEnglish = ["Login", "Signup"];
       
        signupButton.innerHTML = languageEnglish[1];
        loginButton.innerHTML = languageEnglish[0];
        title.innerHTML = "Index";
        setCookie("English");
    }
    else
    {
        var signupButton = document.getElementById("signupButton");
        var loginButton = document.getElementById("loginButton");
        var title = document.getElementById("title");

        var languageEnglish = ["Login", "Signup"];
        var languageFrench = ["S\'identifier", "S\'inscrire"];
        var languageSpanish = ["Iniciar sesión", "Regístrate"];

        if (prefered_language == "English")
        {
            signupButton.innerHTML = languageEnglish[1];
            loginButton.innerHTML = languageEnglish[0];
            title.innerHTML = "Index";
            setCookie("English");
        }
        else if (prefered_language == "French")
        {
            signupButton.innerHTML = languageFrench[1];
            loginButton.innerHTML = languageFrench[0];
            title.innerHTML = "Indice";
            setCookie("French");
        }
        else if (prefered_language == "Spanish")
        {
            signupButton.innerHTML = languageSpanish[1];
            loginButton.innerHTML = languageSpanish[0];
            title.innerHTML = "Índice";
            setCookie("Spanish");
        }
    }
}

function setPreferedLanguageLogin()
{
    var prefered_language = getCookie();
    if (prefered_language == null)
    {
        var title = document.getElementById("title");
        var legend = document.getElementById("legend");
        var username = document.getElementById("username");
        var password = document.getElementById("password");
        var submit = document.getElementById("submit");
        var signupLink = document.getElementById("signupLink");
        var passwordResetLink = document.getElementById("passwordResetLink");
        var orOne = document.getElementById("orOne");
        var orTwo = document.getElementById("orTwo");

        var languageEnglish = ["Login", "Signup", "Username", "Password", "OR", "Password Reset"];

        title.innerHTML = languageEnglish[0];
        legend.innerHTML = languageEnglish[0];
        username.placeholder = languageEnglish[2];
        password.placeholder = languageEnglish[3];
        submit.value = languageEnglish[0];
        signupLink.innerHTML = languageEnglish[1];
        passwordResetLink.innerHTML = languageEnglish[5];
        orOne.innerHTML = languageEnglish[4];
        orTwo.innerHTML = languageEnglish[4];

        setCookie("English");
    }
    else
    {
        var title = document.getElementById("title");
        var legend = document.getElementById("legend");
        var username = document.getElementById("username");
        var password = document.getElementById("password");
        var submit = document.getElementById("submit");
        var signupLink = document.getElementById("signupLink");
        var passwordResetLink = document.getElementById("passwordResetLink");
        var orOne = document.getElementById("orOne");
        var orTwo = document.getElementById("orTwo");
    
        var languageEnglish = ["Login", "Signup", "Username", "Password", "OR", "Password Reset"];
        var languageFrench = ["S\'identifier", "S\'inscrire", "Nom d'utilisateur", "Mot de passe", "OU", "Réinitialisation du mot de passe"];
        var languageSpanish = ["Iniciar sesión", "Regístrate", "Nombre de usuario", "Contraseña", "O", "Restablecimiento de contraseña"];
    
        if (prefered_language == "English")
        {
            title.innerHTML = languageEnglish[0];
            legend.innerHTML = languageEnglish[0];
            username.placeholder = languageEnglish[2];
            password.placeholder = languageEnglish[3];
            submit.value = languageEnglish[0];
            signupLink.innerHTML = languageEnglish[1];
            passwordResetLink.innerHTML = languageEnglish[5];
            orOne.innerHTML = languageEnglish[4];
            orTwo.innerHTML = languageEnglish[4];
            setCookie("English");
        }
        else if (prefered_language == "French")
        {
            title.innerHTML = languageFrench[0];
            legend.innerHTML = languageFrench[0];
            username.placeholder = languageFrench[2];
            password.placeholder = languageFrench[3];
            submit.value = languageFrench[0];
            signupLink.innerHTML = languageFrench[1];
            passwordResetLink.innerHTML = languageFrench[5];
            orOne.innerHTML = languageFrench[4];
            orTwo.innerHTML = languageFrench[4];
            setCookie("French");
        }
        else if (prefered_language == "Spanish")
        {
            title.innerHTML = languageSpanish[0];
            legend.innerHTML = languageSpanish[0];
            username.placeholder = languageSpanish[2];
            password.placeholder = languageSpanish[3];
            submit.value = languageSpanish[0];
            signupLink.innerHTML = languageSpanish[1];
            passwordResetLink.innerHTML = languageSpanish[5];
            orOne.innerHTML = languageSpanish[4];
            orTwo.innerHTML = languageSpanish[4];
            setCookie("Spanish");
        }
    }
}

function setPreferedLanguageSignup()
{
    var prefered_language = getCookie();
    console.log("prefered language: "+prefered_language);
    if (prefered_language == null)
    {
        var title = document.getElementById("title");
        var legend = document.getElementById("legend");
        var username = document.getElementById("username");
        var firstname = document.getElementById("firstname");
        var lastname = document.getElementById("lastname");
        var email = document.getElementById("email");
        var login = document.getElementById("login");
        var password = document.getElementById("password");
        var submit = document.getElementById("submit");
        var orOne = document.getElementById("orOne");

        var languageEnglish = ["Signup", "Firstname", "Lastname", "Username", "Email", "Password", "Submit", "OR", "Login"];
        
        title.innerHTML = languageEnglish[0];
        legend.innerHTML = languageEnglish[0];
        firstname.placeholder = languageEnglish[1];
        lastname.placeholder = languageEnglish[2];
        username.placeholder = languageEnglish[3];
        email.placeholder = languageEnglish[4];
        password.placeholder = languageEnglish[5];
        submit.value = languageEnglish[6];
        orOne.innerHTML = languageEnglish[7];
        login.innerHTML = languageEnglish[8];
        setCookie("English");
    }
    else
    {
        var title = document.getElementById("title");
        var legend = document.getElementById("legend");
        var username = document.getElementById("username");
        var firstname = document.getElementById("firstname");
        var lastname = document.getElementById("lastname");
        var email = document.getElementById("email");
        var login = document.getElementById("login");
        var password = document.getElementById("password");
        var submit = document.getElementById("submit");
        var orOne = document.getElementById("orOne");
    
        var languageEnglish = ["Signup", "Firstname", "Lastname", "Username", "Email", "Password", "Submit", "OR", "Login"];
        var languageFrench = ["S'inscrire", "Prénom", "Nom de famille", "Nom d'utilisateur", "Email", "Mot de passe", "Soumettre", "OU", "S'identifier"];
        var languageSpanish = ["Regístrate", "Primer nombre", "Apellido", "Nombre de usuario", "Email", "Contraseña", "Enviar", "O", "Iniciar sesión"];
    
        if (prefered_language == "English")
        {
            title.innerHTML = languageEnglish[0];
            legend.innerHTML = languageEnglish[0];
            firstname.placeholder = languageEnglish[1];
            lastname.placeholder = languageEnglish[2];
            username.placeholder = languageEnglish[3];
            email.placeholder = languageEnglish[4];
            password.placeholder = languageEnglish[5];
            submit.value = languageEnglish[6];
            orOne.innerHTML = languageEnglish[7];
            login.innerHTML = languageEnglish[8];
            setCookie("English");
        }
        else if (prefered_language == "French")
        {
            title.innerHTML = languageFrench[0];
            legend.innerHTML = languageFrench[0];
            firstname.placeholder = languageFrench[1];
            lastname.placeholder = languageFrench[2];
            username.placeholder = languageFrench[3];
            email.placeholder = languageFrench[4];
            password.placeholder = languageFrench[5];
            submit.value = languageFrench[6];
            orOne.innerHTML = languageFrench[7];
            login.innerHTML = languageFrench[8];
            setCookie("French");
        }
        else if (prefered_language == "Spanish")
        {
            title.innerHTML = languageSpanish[0];
            legend.innerHTML = languageSpanish[0];
            firstname.placeholder = languageSpanish[1];
            lastname.placeholder = languageSpanish[2];
            username.placeholder = languageSpanish[3];
            email.placeholder = languageSpanish[4];
            password.placeholder = languageSpanish[5];
            submit.value = languageSpanish[6];
            orOne.innerHTML = languageSpanish[7];
            login.innerHTML = languageSpanish[8];
            setCookie("Spanish");
        }
    }
}

function setPreferedLanguagePasswordReset()
{
    var prefered_language = getCookie();

    if (prefered_language == null)
    {
        var title = document.getElementById("title");
        var legend = document.getElementById("legend");
        var email = document.getElementById("email");
        var submit = document.getElementById("submit");
        var OR = document.getElementById("OR");
        var login = document.getElementById("login");

        var languageEnglish = ["Password Reset", "Email", "Send reset link", "OR", "Login"];
        title.innerHTML = languageEnglish[0];
        legend.innerHTML = languageEnglish[0];
        email.placeholder = languageEnglish[1];
        submit.value = languageEnglish[2];
        OR.innerHTML = languageEnglish[3];
        login.innerHTML = languageEnglish[4];
        setCookie("English");
    }
    else
    {
        var title = document.getElementById("title");
        var legend = document.getElementById("legend");
        var email = document.getElementById("email");
        var submit = document.getElementById("submit");
        var OR = document.getElementById("OR");
        var login = document.getElementById("login");

        var languageEnglish = ["Password Reset", "Email", "Send reset link", "OR", "Login"];
        var languageFrench = ["Réinitialisation du mot de passe", "Email", "Envoyer le lien de réinitialisation", "OU", "S'identifier"];
        var languageSpanish = ["Restablecimiento de contraseña", "Email", "Enviar enlace de restablecimiento", "O", "Iniciar sesión"]

        if (prefered_language == "English")
        {
            title.innerHTML = languageEnglish[0];
            legend.innerHTML = languageEnglish[0];
            email.placeholder = languageEnglish[1];
            submit.value = languageEnglish[2];
            OR.innerHTML = languageEnglish[3];
            login.innerHTML = languageEnglish[4];
            setCookie("English");
        }
        else if (prefered_language == "French")
        {
            title.innerHTML = languageFrench[0];
            legend.innerHTML = languageFrench[0];
            email.placeholder = languageFrench[1];
            submit.value = languageFrench[2];
            OR.innerHTML = languageFrench[3];
            login.innerHTML = languageFrench[4];
            setCookie("French");
        }
        else if (prefered_language == "Spanish")
        {
            title.innerHTML = languageSpanish[0];
            legend.innerHTML = languageSpanish[0];
            email.placeholder = languageSpanish[1];
            submit.value = languageSpanish[2];
            OR.innerHTML = languageSpanish[3];
            login.innerHTML = languageSpanish[4];
            setCookie("Spanish");
        }
    }
}

function languageIndex()
{
    var selector = document.getElementById("language");
    var signupButton = document.getElementById("signupButton");
    var loginButton = document.getElementById("loginButton");
    var title = document.getElementById("title");

    var languageEnglish = ["Login", "Signup"];
    var languageFrench = ["S\'identifier", "S\'inscrire"];
    var languageSpanish = ["Iniciar sesión", "Regístrate"];

    if (selector.value == "English")
    {
        signupButton.innerHTML = languageEnglish[1];
        loginButton.innerHTML = languageEnglish[0];
        title.innerHTML = "Index";
        setCookie("English");
    }
    else if (selector.value == "French")
    {
        signupButton.innerHTML = languageFrench[1];
        loginButton.innerHTML = languageFrench[0];
        title.innerHTML = "Indice";
        setCookie("French");
    }
    else if (selector.value == "Spanish")
    {
        signupButton.innerHTML = languageSpanish[1];
        loginButton.innerHTML = languageSpanish[0];
        title.innerHTML = "Índice";
        setCookie("Spanish");
    }
}

function languageLogin()
{
    var selector = document.getElementById("language");
    var title = document.getElementById("title");
    var legend = document.getElementById("legend");
    var username = document.getElementById("username");
    var password = document.getElementById("password");
    var submit = document.getElementById("submit");
    var signupLink = document.getElementById("signupLink");
    var passwordResetLink = document.getElementById("passwordResetLink");
    var orOne = document.getElementById("orOne");
    var orTwo = document.getElementById("orTwo");

    var languageEnglish = ["Login", "Signup", "Username", "Password", "OR", "Password Reset"];
    var languageFrench = ["S\'identifier", "S\'inscrire", "Nom d'utilisateur", "Mot de passe", "OU", "Réinitialisation du mot de passe"];
    var languageSpanish = ["Iniciar sesión", "Regístrate", "Nombre de usuario", "Contraseña", "O", "Restablecimiento de contraseña"];

    if (selector.value == "English")
    {
        title.innerHTML = languageEnglish[0];
        legend.innerHTML = languageEnglish[0];
        username.placeholder = languageEnglish[2];
        password.placeholder = languageEnglish[3];
        submit.value = languageEnglish[0];
        signupLink.innerHTML = languageEnglish[1];
        passwordResetLink.innerHTML = languageEnglish[5];
        orOne.innerHTML = languageEnglish[4];
        orTwo.innerHTML = languageEnglish[4];
        setCookie("English");
    }
    else if (selector.value == "French")
    {
        title.innerHTML = languageFrench[0];
        legend.innerHTML = languageFrench[0];
        username.placeholder = languageFrench[2];
        password.placeholder = languageFrench[3];
        submit.value = languageFrench[0];
        signupLink.innerHTML = languageFrench[1];
        passwordResetLink.innerHTML = languageFrench[5];
        orOne.innerHTML = languageFrench[4];
        orTwo.innerHTML = languageFrench[4];
        setCookie("French");
    }
    else if (selector.value == "Spanish")
    {
        title.innerHTML = languageSpanish[0];
        legend.innerHTML = languageSpanish[0];
        username.placeholder = languageSpanish[2];
        password.placeholder = languageSpanish[3];
        submit.value = languageSpanish[0];
        signupLink.innerHTML = languageSpanish[1];
        passwordResetLink.innerHTML = languageSpanish[5];
        orOne.innerHTML = languageSpanish[4];
        orTwo.innerHTML = languageSpanish[4];
        setCookie("Spanish");
    }
}

function languageSignup()
{
    var selector = document.getElementById("language");
    var title = document.getElementById("title");
    var legend = document.getElementById("legend");
    var username = document.getElementById("username");
    var firstname = document.getElementById("firstname");
    var lastname = document.getElementById("lastname");
    var email = document.getElementById("email");
    var login = document.getElementById("login");
    var password = document.getElementById("password");
    var submit = document.getElementById("submit");
    var orOne = document.getElementById("orOne");

    var languageEnglish = ["Signup", "Firstname", "Lastname", "Username", "Email", "Password", "Submit", "OR", "Login"];
    var languageFrench = ["S'inscrire", "Prénom", "Nom de famille", "Nom d'utilisateur", "Email", "Mot de passe", "Soumettre", "OU", "S'identifier"];
    var languageSpanish = ["Regístrate", "Primer nombre", "Apellido", "Nombre de usuario", "Email", "Contraseña", "Enviar", "O", "Iniciar sesión"];

    if (selector.value == "English")
    {
        title.innerHTML = languageEnglish[0];
        legend.innerHTML = languageEnglish[0];
        firstname.placeholder = languageEnglish[1];
        lastname.placeholder = languageEnglish[2];
        username.placeholder = languageEnglish[3];
        email.placeholder = languageEnglish[4];
        password.placeholder = languageEnglish[5];
        submit.value = languageEnglish[6];
        orOne.innerHTML = languageEnglish[7];
        login.innerHTML = languageEnglish[8];
        setCookie("English");
    }
    else if (selector.value == "French")
    {
        title.innerHTML = languageFrench[0];
        legend.innerHTML = languageFrench[0];
        firstname.placeholder = languageFrench[1];
        lastname.placeholder = languageFrench[2];
        username.placeholder = languageFrench[3];
        email.placeholder = languageFrench[4];
        password.placeholder = languageFrench[5];
        submit.value = languageFrench[6];
        orOne.innerHTML = languageFrench[7];
        login.innerHTML = languageFrench[8];
        setCookie("French");
    }
    else if (selector.value == "Spanish")
    {
        title.innerHTML = languageSpanish[0];
        legend.innerHTML = languageSpanish[0];
        firstname.placeholder = languageSpanish[1];
        lastname.placeholder = languageSpanish[2];
        username.placeholder = languageSpanish[3];
        email.placeholder = languageSpanish[4];
        password.placeholder = languageSpanish[5];
        submit.value = languageSpanish[6];
        orOne.innerHTML = languageSpanish[7];
        login.innerHTML = languageSpanish[8];
        setCookie("Spanish");
    }
}

function languagePasswordReset()
{
    var selector = document.getElementById("language");
    var title = document.getElementById("title");
    var legend = document.getElementById("legend");
    var email = document.getElementById("email");
    var submit = document.getElementById("submit");
    var OR = document.getElementById("OR");
    var login = document.getElementById("login");

    var languageEnglish = ["Password Reset", "Email", "Send reset link", "OR", "Login"];
    var languageFrench = ["Réinitialisation du mot de passe", "Email", "Envoyer le lien de réinitialisation", "OU", "S'identifier"];
    var languageSpanish = ["Restablecimiento de contraseña", "Email", "Enviar enlace de restablecimiento", "O", "Iniciar sesión"]

    if (selector.value == "English")
    {
        title.innerHTML = languageEnglish[0];
        legend.innerHTML = languageEnglish[0];
        email.placeholder = languageEnglish[1];
        submit.value = languageEnglish[2];
        OR.innerHTML = languageEnglish[3];
        login.innerHTML = languageEnglish[4];
        setCookie("English");
    }
    else if (selector.value == "French")
    {
        title.innerHTML = languageFrench[0];
        legend.innerHTML = languageFrench[0];
        email.placeholder = languageFrench[1];
        submit.value = languageFrench[2];
        OR.innerHTML = languageFrench[3];
        login.innerHTML = languageFrench[4];
        setCookie("French");
    }
    else if (selector.value == "Spanish")
    {
        title.innerHTML = languageSpanish[0];
        legend.innerHTML = languageSpanish[0];
        email.placeholder = languageSpanish[1];
        submit.value = languageSpanish[2];
        OR.innerHTML = languageSpanish[3];
        login.innerHTML = languageSpanish[4];
        setCookie("Spanish");
    }
}