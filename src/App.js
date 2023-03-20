import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import { escrowAbi, realEstateAbi } from './constants';

// Config
import config from './config.json';

function App() {
  const [account, setAccount] = useState(null);
  const [homes, setHomes] = useState([]);
  const [home, setHome] = useState({});
  const [toggle, setToggle] = useState(false);

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const network = await provider.getNetwork();

    const realEstate = new ethers.Contract(config[network.chainId].realEstate.address, realEstateAbi, provider);
    const totalSupply = await realEstate.totalSupply();
    const homes = [];
    for (let i = 1; i <= totalSupply; i++) {
      const tokenURI = await realEstate.tokenURI(i);
      const response = await fetch(tokenURI);
      const metadata = await response.json();
      homes.push(metadata);
    }
    setHomes(homes);
    console.log(homes);


    const escrow = new ethers.Contract(config[network.chainId].escrow.address, escrowAbi, provider);


    window.ethereum.on('accountsChanged', async () => {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const account = await ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    });
  }

  const toggleProp = (home) => {
    console.log(home);
    setToggle(!toggle);
  }

  useEffect(() => {
    loadBlockchainData();
  }, []);

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />
      <div className='cards__section'>

        <h3>Homes For You</h3>
        <hr />

        <div className="cards">
        {homes.map((home, index) => (
          <div className="card" key={index} onClick={() => toggleProp(home)} >
            <div className="card__image">
              <img src={home.image} alt="Home" />
            </div>
            <div className="card__info">
              <h4>{home.attributes[0].value} ETH</h4>
              <p>
                <strong>{home.attributes[2].value}</strong> Bedroom | 
                <strong>{home.attributes[3].value}</strong> Bathroom |
                <strong>{home.attributes[4].value}</strong> sq ft
              </p>
              <p>{home.address}</p>
            </div>
          </div>
        ))}          
        </div>
      </div>

      {toggle && (
        <Home />
      )}
    </div>
  );
}

export default App;
