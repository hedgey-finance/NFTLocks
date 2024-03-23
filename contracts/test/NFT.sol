// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.24;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';

contract NFT is ERC721Enumerable {

  string _uri;

  constructor(string memory uri) ERC721('NFT', 'NFT') {
    _uri = uri;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _uri;
  }

  function mint(address to, uint256 tokenId) external {
    _mint(to, tokenId);
  }

  function transferWithData(address to, uint256 tokenId, bytes memory data) external {
    safeTransferFrom(msg.sender, to, tokenId, data);
  }
}