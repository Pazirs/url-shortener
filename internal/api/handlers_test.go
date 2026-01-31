package api

import (
	"testing"
)

// TestGenerateShortCode vérifie quesi le générateur cré bien des codes de la bonne longueur
// et qu'ils sont constitués de caractères de a z
func TestGenerateShortCode(t *testing.T) {
	length := 6
	code := generateShortCode(length)

	//  Vérifier la longueur
	if len(code) != length {
		t.Errorf("Le code généré a une longueur de %d, attendu %d", len(code), length)
	}

	//  Vérifier les caractères (Alphanumérique uniquement)
	for _, char := range code {
		isValid := (char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9')

		if !isValid {
			t.Errorf("Caractère invalide trouvé dans le code : %c", char)
		}
	}
}

// TestUniqueness vérifie statistiquement que le générateur ne sort pas 2foisle même code de suite
func TestUniqueness(t *testing.T) {
	code1 := generateShortCode(6)
	code2 := generateShortCode(6)

	if code1 == code2 {
		t.Errorf("Le générateur a produit deux fois le même code de suite : %s", code1)
	}
}
