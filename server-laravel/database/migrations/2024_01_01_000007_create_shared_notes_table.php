<?php
// database/migrations/2024_01_01_000007_create_shared_notes_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Tiêu chí 25: Chia sẻ note
        Schema::create('shared_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('note_id')->constrained()->cascadeOnDelete();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('shared_with')->constrained('users')->cascadeOnDelete();
            $table->enum('role', ['viewer', 'editor'])->default('viewer');
            $table->timestamps();
            $table->unique(['note_id', 'shared_with'], 'unique_share');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shared_notes');
    }
};
