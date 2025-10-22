// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// This contract creates a permanent, verifiable record for product batches.
contract Traceability {

    // Represents the initial registration of a product batch.
    struct ProductBatch {
        bytes32 batchId;
        string productId; // The ID from your MongoDB database
        string productName;
        string supplierId;
        string origin; // e.g., "Punjab Agro Farms"
        uint256 creationTimestamp;
    }

    // Represents a transfer of a portion of a batch to a vendor.
    struct TransferLog {
        string vendorId;
        string orderId;
        uint256 quantity;
        uint256 transferTimestamp;
    }

    // A mapping from a unique batch ID to the batch's details.
    mapping(bytes32 => ProductBatch) public productBatches;
    // A mapping from a batch ID to its history of transfers.
    mapping(bytes32 => TransferLog[]) public transferHistory;

    // Events to log major actions on the blockchain.
    event BatchCreated(bytes32 indexed batchId, string productId, string supplierId);
    event BatchTransferred(bytes32 indexed batchId, string vendorId, uint256 quantity);

    /**
     * @dev Creates a new product batch record on the blockchain.
     * This function is intended to be called by your backend blockchain service.
     */
    function createProductBatch(
        string memory _productId,
        string memory _productName,
        string memory _supplierId,
        string memory _origin
    ) public {
        // Create a unique, deterministic ID for the batch.
        bytes32 batchId = keccak256(abi.encodePacked(_productId, _supplierId, block.timestamp));

        // Ensure this batch hasn't been created before.
        require(productBatches[batchId].creationTimestamp == 0, "Batch already exists.");

        productBatches[batchId] = ProductBatch({
            batchId: batchId,
            productId: _productId,
            productName: _productName,
            supplierId: _supplierId,
            origin: _origin,
            creationTimestamp: block.timestamp
        });

        emit BatchCreated(batchId, _productId, _supplierId);
    }

    /**
     * @dev Logs the transfer of a certain quantity of a product batch to a vendor.
     * This function is intended to be called by your backend blockchain service.
     */
    function logTransfer(
        bytes32 _batchId,
        string memory _vendorId,
        string memory _orderId,
        uint256 _quantity
    ) public {
        // Ensure the batch exists before logging a transfer against it.
        require(productBatches[_batchId].creationTimestamp != 0, "Batch does not exist.");

        transferHistory[_batchId].push(TransferLog({
            vendorId: _vendorId,
            orderId: _orderId,
            quantity: _quantity,
            transferTimestamp: block.timestamp
        }));

        emit BatchTransferred(_batchId, _vendorId, _quantity);
    }
}