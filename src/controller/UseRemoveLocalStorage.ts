const UseRemoveLocalStorage = () => {
    localStorage.removeItem("firstname");
    localStorage.removeItem("userId");

    localStorage.removeItem("doctorId");
    localStorage.removeItem("name");
    localStorage.removeItem("image");
    sessionStorage.removeItem("token");

    localStorage.removeItem("userType");

    localStorage.removeItem("count");
};

export default UseRemoveLocalStorage;
