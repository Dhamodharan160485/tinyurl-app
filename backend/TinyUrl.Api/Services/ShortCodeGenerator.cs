// =====================================================
// FILE: Services/ShortCodeGenerator.cs
// PURPOSE: Generates a random 6-character short code
//          e.g. "aB3xKq", "Tz9mPq", "kL2nXr"
//
// DESIGN PATTERN: Service Pattern
//  Business logic is extracted into its own class
//  API routes (Program.cs) don't contain this logic
//
// SOLID: Single Responsibility Principle
//  This class has ONE job: generate short codes
// =====================================================

namespace TinyUrl.Api.Services
{
    public class ShortCodeGenerator
    {
        // -------------------------------------------------------
        // These are all the characters that can appear
        // in a short code.
        //
        // a-z = 26 characters
        // A-Z = 26 characters
        // 0-9 = 10 characters
        // Total = 62 characters
        //
        // With 6 characters from 62 options:
        // 62^6 = 56 billion possible combinations
        // So collision (duplicate code) is very unlikely
        // -------------------------------------------------------
        private const string Chars =
            "abcdefghijklmnopqrstuvwxyz" +
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
            "0123456789";

        // -------------------------------------------------------
        // Random object for picking random characters
        // It is static so we reuse the same instance
        // instead of creating a new one every time
        // -------------------------------------------------------
        private static readonly Random Random = new();

        // -------------------------------------------------------
        // Generate() - creates a random short code
        //
        // How it works step by step:
        // 1. Enumerable.Range(0, length)  creates [0,1,2,3,4,5]
        // 2. For each number, pick a random character from Chars
        // 3. Random.Next(Chars.Length)  picks index 0 to 61
        // 4. Chars[index]  gets the character at that index
        // 5. ToArray()  converts to char array ['a','B','3','x','K','q']
        // 6. new string(...)  converts to string "aB3xKq"
        //
        // Parameter:
        // length = how many characters the code should have
        //          default is 6 as per requirement
        // -------------------------------------------------------
        public static string Generate(int length = 6)
        {
            return new string(
                Enumerable
                    .Range(0, length)
                    .Select(_ => Chars[Random.Next(Chars.Length)])
                    .ToArray()
            );
        }
    }
}