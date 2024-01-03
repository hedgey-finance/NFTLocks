
pragma solidity 0.8.19;

interface ILiquidityLocks {

    struct Lock {
        address tokenA,
        address tokenB,
        address liquidityAddress,
        uint256 amount,
        uint256 tokenId,
        uint256 unlockTime
    }

    function lockLiquidity(address recipient, Lock memory lock)
}