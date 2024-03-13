// userID === socket.id
export function setUserID(id) {
  localStorage.setItem("userID", id)
}

export function getUserID() {
  return localStorage.getItem("userID")
}