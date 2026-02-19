namespace AutoLogix.Domain.Common
{
    public static class InsuranceTypes
    {
        public const string OC = "OC";
        public const string AC = "AC";
        public const string OC_AC = "OC_AC";
        public const string ANY = "ANY";
    }

    public static class OfferRequestStatuses
    {
        public const string Open = "Open";
        public const string Cancelled = "Cancelled";
        public const string Fulfilled = "Fulfilled";
    }

    public static class OfferStatuses
    {
        public const string Proposed = "Proposed";
        public const string Accepted = "Accepted";
        public const string Rejected = "Rejected";
        public const string Expired = "Expired";
    }
}
