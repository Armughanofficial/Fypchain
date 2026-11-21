// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ThesisPlatform is ERC721URIStorage, Ownable {
    IERC20 public immutable tcrToken;
    uint256 private _nextTokenId = 1;

    struct Project {
        uint256 projectId;
        address creator;
        uint256 price;
        uint256 tokenId;
        string metadataURI;
        bool exists;
        bool isApproved;
    }

    mapping(uint256 => Project) public projects;
    mapping(uint256 => mapping(address => bool)) public hasLicensed;
    mapping(uint256 => bool) public bookingPaid;

    event ProjectSubmitted(uint256 indexed projectId, address indexed creator, uint256 price);
    event ProjectApproved(uint256 indexed projectId, address indexed creator, uint256 tokenId);
    event ProjectLicensed(uint256 indexed projectId, address indexed buyer, address indexed creator, uint256 price);
    event MentorshipPaid(uint256 indexed bookingId, address indexed student, address indexed mentor, uint256 amount);

    constructor(address _tcrTokenAddress) ERC721("FypChain Certificate", "FYPC") Ownable(msg.sender) {
        tcrToken = IERC20(_tcrTokenAddress);
    }

    function registerProject(
        uint256 projectId,
        string calldata metadataURI,
        uint256 price
    ) external {
        require(!projects[projectId].exists, "Project ID already registered");
        require(price > 0, "Price must be greater than zero");

        projects[projectId] = Project({
            projectId: projectId,
            creator: msg.sender,
            price: price,
            tokenId: 0,
            metadataURI: metadataURI,
            exists: true,
            isApproved: false
        });

        emit ProjectSubmitted(projectId, msg.sender, price);
    }

    function approveProject(uint256 projectId) external onlyOwner returns (uint256) {
        Project storage proj = projects[projectId];
        require(proj.exists, "Project does not exist");
        require(!proj.isApproved, "Project already approved");

        uint256 tokenId = _nextTokenId++;
        proj.isApproved = true;
        proj.tokenId = tokenId;

        _safeMint(proj.creator, tokenId);
        _setTokenURI(tokenId, proj.metadataURI);

        emit ProjectApproved(projectId, proj.creator, tokenId);
        return tokenId;
    }

    function licenseProject(uint256 projectId) external {
        Project memory proj = projects[projectId];
        require(proj.exists, "Project does not exist");
        require(proj.isApproved, "Project not approved by admin");
        require(proj.creator != msg.sender, "Creator cannot license own project");
        require(!hasLicensed[projectId][msg.sender], "Already licensed");

        hasLicensed[projectId][msg.sender] = true;
        require(tcrToken.transferFrom(msg.sender, proj.creator, proj.price), "TCR transfer failed");

        emit ProjectLicensed(projectId, msg.sender, proj.creator, proj.price);
    }

    function payMentorship(uint256 bookingId, address mentor, uint256 amount) external {
        require(!bookingPaid[bookingId], "Booking already paid");
        require(mentor != address(0) && mentor != msg.sender, "Invalid mentor address");
        require(amount > 0, "Invalid amount");

        bookingPaid[bookingId] = true;
        require(tcrToken.transferFrom(msg.sender, mentor, amount), "TCR transfer failed");

        emit MentorshipPaid(bookingId, msg.sender, mentor, amount);
    }

    // Soulbound enforcement: block transfers while allowing initial minting
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: Certificate NFTs are non-transferable");
        }
        return super._update(to, tokenId, auth);
    }
}