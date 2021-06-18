Moralis.initialize("");
Moralis.serverURL = ''
const TOKEN_CONTRACT_ADDRESS = ""



init = async () => {
    hideElement(userInfo);
    hideElement(userItemsSection);
    hideElement(createItemForm);
    window.web3 = await Moralis.Web3.enable();
    window.tokenContract = new web3.eth.Contract(tokenContractAbi, TOKEN_CONTRACT_ADDRESS); 
    initUser();
}

initUser = async () => {
    if (await Moralis.User.current()) { 
        hideElement(userConnectButton); 
        showElement(userProfileButton);
        showElement(openCreateItemButton);  
        showElement(openUserItemsButton);
        loadUserItems();
    } 
    else {
        showElement(userConnectButton);
        hideElement(userProfileButton);
        hideElement(openCreateItemButton); 
        hideElement(openUserItemsButton);
    }
}

login = async () => {
    try {
        await Moralis.Web3.authenticate();
        initUser();
    } catch (error) {
        alert(error);
        hideElement(userInfo);
        initUser();
    }
}

logout = async () => {
    await Moralis.User.logOut();
    hideElement(userInfo);
    initUser();
}

openUserInfo = async () => {
    user = await Moralis.User.current();
    if (user){

        const email = user.get("email");

        if(email){
            userEmailField.value = email;
        }else{
            userEmailField.value = "";
        }

        userUsernameField.value = user.get("username");
        const userAvatar = user.get("avatar");

        if(userAvatar){
            userAvatarImg.src = userAvatar.url();
            showElement(userAvatarImg);
        }else{
            hideElement(userAvatarImg);
        }

        showElement(userInfo);
    } else {
        login();
    }
}

saveUserInfo = async () => {
    user.set('email', userEmailField.value);    
    user.set('username', userUsernameField.value);

    if (userAvaterFile.files.length > 0) {
        const avatar = new Moralis.File("avatar.jpg", userAvaterFile.files[0]);
        user.set('avatar', avatar);
        /* try {
            await avatar.saveIPFS();
        } catch (error) {
            alert("Something went wrong with IPFS", error);
        }
       */ 
      }
    await user.save()
    
    alert("User info saved successfully!");
      
}

createItem = async () => {

    if (createItemFile.files.length == 0){
        alert("Please select a file!");
        return;
    } else if (createItemNameField.value.lenth == 0){
        alert("Please give the item a name!");
        return;
    }

    console.log("input file", createItemFile.files[0]);
    const nftFile = new Moralis.File("nftFile.jpg", createItemFile.files[0]);
    
    console.log("moralis nftFile", nftFile);
    await nftFile.saveIPFS();

    const nftFilePath = nftFile.ipfs();
    const nftFileHash = nftFile.hash(); 

    const metadata = {
        name: createItemNameField.value,
        description: createItemDescriptionField.value,
        image: nftFilePath,
    };

    const nftFileMetadataFile = new Moralis.File("metadata.json", {base64 : btoa(JSON.stringify(metadata))});
    await nftFileMetadataFile.saveIPFS();

    const nftFileMetadataFilePath = nftFileMetadataFile.ipfs();
    const nftFileMetadataFileHash = nftFileMetadataFile.hash();

    const nftId = await mintNft(nftFileMetadataFilePath);

    // Simple syntax to create a new subclass of Moralis.Object.
    const Item = Moralis.Object.extend("Item");
    // Create a new instance of that class.
    const item = new Item();
    item.set("name", createItemNameField.value);
    item.set("description", createItemDescriptionField.value);
    item.set("nftFilePath", nftFilePath);
    item.set("nftFileHash", nftFileHash);
    item.set("MetadataFilePath", nftFileMetadataFilePath);
    item.set("MetadataFileHash", nftFileMetadataFileHash);
    item.set('nftId', nftId);
    item.set('nftContractAddress', TOKEN_CONTRACT_ADDRESS);
    await item.save();
    console.log(item);

}

mintNft = async (metadataUrl) => {
    const receipt = await tokenContract.methods.createItem(metadataUrl).send({from: ethereum.selectedAddress});
    console.log(receipt);
    return receipt.events.Transfer.returnValues.tokenId;
}


openUserItems = async () => {
    user = await Moralis.User.current();
    if (user){
        showElement(userItemsSection);
    } else {
        login();
    } 
}   

loadUserItems = async () => {
    const ownedItems = await Moralis.Cloud.run("getUserItems")
    ownedItems.forEach(item => {
        getAndRenderItemData(item, renderUserItem);
    });
}

initTemplate = (id) => {
    const template = document.getElementById(id);
    template.id = "";
    template.parentNode.removeChild(template);
    return template;    

}

renderUserItem = (item) => {
    const userItem = userItemTemplate.cloneNode(true);
    userItem.getElementsByTagName("img")[0].src = item.image;
    userItem.getElementsByTagName("img")[0].alt = item.name;
    userItem.getElementsByTagName("h5")[0].innerText = item.name;
    userItem.getElementsByTagName("p")[0].innerText = item.description;
    userItems.appendChild(userItem)
}

getAndRenderItemData = (item, renderFunction) => {
    alert(item)
    console.log(item);
    fetch(item.tokenUri)
    .then(response => response.json())
    .then(data => {
        data.symbol = item.symbol;
        data.tokenId = item.tokenId;
        data.tokenAddress = item.tokenAddress;
        renderFunction(data);
    })
}

hideElement = (element) => element.style.display = "none";
showElement = (element) => element.style.display = "block";

//Navbar
const userConnectButton = document.getElementById("btnConnect");
userConnectButton.onclick = login;

const userProfileButton = document.getElementById("btnUserInfo");
userProfileButton.onclick = openUserInfo;

const openCreateItemButton = document.getElementById("btnOpenCreateItem");
openCreateItemButton.onclick = () => showElement(createItemForm);

//User Profile
const userInfo = document.getElementById("userInfo");
const userUsernameField = document.getElementById("txtUsername");
const userEmailField = document.getElementById("txtEmail");
const userAvatarImg = document.getElementById("imgAvater");
const userAvaterFile = document.getElementById("fileAvatar");

document.getElementById("btnCloseUserInfo").onclick = () => hideElement(userInfo);
document.getElementById("btnLogout").onclick = logout;
document.getElementById("btnSaveUserInfo").onclick = saveUserInfo;

//Item Creation
const createItemForm = document.getElementById("CreateItem");
const createItemNameField = document.getElementById("txtCreateItemName");
const createItemDescriptionField = document.getElementById("txtCreateItemDescription");
const createItemItemPriceField = document.getElementById("numCreateItemPrice");
const createItemFile = document.getElementById("fileCreateItemFile");

document.getElementById("btnCloseCreateItem").onclick = () => hideElement(createItemForm);
document.getElementById("btnCreateItem").onclick = createItem;

//User Items
const userItemsSection = document.getElementById("userItems");
const UserItems = document.getElementById("userItemsList");
document.getElementById("btnCloseUserItems").onclick = () => hideElement(userItemsSection);
const openUserItemsButton = document.getElementById("btnMyItems");
const userItemTemplate = initTemplate("itemTemplate");
openUserItemsButton.onclick = openUserItems;

init();         
