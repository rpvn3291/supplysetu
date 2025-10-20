// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Reviews
 * @dev A simple smart contract to store reviews immutably on the blockchain.
 */
contract Reviews {
    // A custom data structure to represent a single review.
    struct Review {
        uint256 id; // A unique ID for each review
        string targetUserId; // The user being reviewed
        string reviewerId;   // The user who wrote the review
        string orderId;      // The order this review is linked to
        uint8 rating;        // The star rating (1-5)
        string comment;      // The optional text comment
        uint256 timestamp;   // The time the review was added
    }

    // A counter to ensure each review gets a unique ID.
    uint256 private _reviewCounter;

    // This is the main storage array. All reviews will be stored here permanently.
    // The 'public' keyword automatically creates a getter function for it.
    Review[] public allReviews;

    // An event is like a log entry on the blockchain. It's a cheap way to
    // signal that something happened, which can be useful for external services to listen to.
    event ReviewAdded(
        uint256 id,
        string targetUserId,
        string reviewerId,
        string orderId,
        uint8 rating
    );

    /**
     * @dev Adds a new review to the blockchain.
     * This function will be called by our backend 'listener.js' service.
     */
    function addReview(
        string memory _targetUserId,
        string memory _reviewerId,
        string memory _orderId,
        uint8 _rating,
        string memory _comment
    ) public {
        // Ensure the rating is between 1 and 5.
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");

        // Increment the counter to get a new unique ID.
        _reviewCounter++;

        // Create a new Review struct in memory and add it to the storage array.
        allReviews.push(
            Review({
                id: _reviewCounter,
                targetUserId: _targetUserId,
                reviewerId: _reviewerId,
                orderId: _orderId,
                rating: _rating,
                comment: _comment,
                timestamp: block.timestamp // A global variable for the current block's timestamp
            })
        );

        // Emit the event to log that a new review was added.
        emit ReviewAdded(_reviewCounter, _targetUserId, _reviewerId, _orderId, _rating);
    }

    /**
     * @dev Returns the total number of reviews stored.
     */
    function getTotalReviews() public view returns (uint256) {
        return allReviews.length;
    }
}
